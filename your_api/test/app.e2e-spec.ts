import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransactionService } from './../src/transaction.service';
import { TransactionStatus } from './../src/transaction.dto';
import { ThirdPartyService } from './../src/thirdParty.service';
import 'jest-expect-message';


let app: INestApplication;
let transactionService: TransactionService;
let thirdPartyService: ThirdPartyService;
const logger = new Logger("TEST");

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  transactionService = app.get(TransactionService);
  thirdPartyService = app.get(ThirdPartyService);
});

afterAll(async () => {
  await app.close();
});

describe('Third party API', () => {

  it('should keep retrying on third-partys timeouts, that eventually save the transaction in their DB', async () => {
    const postTransactionResult = await request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 23, workingConditions: {
        shouldTimeout: true,
        shouldTimeoutAndWork: true,
        shouldSendWebhook: false,
      }});

    const transactionId = postTransactionResult.body.id;
    await Promise.all([
      new Promise<void>((resolve) => { setTimeout(async () => {
        const transactionStatus = await getTransaction(transactionId);
        expect(transactionStatus, "Transaction should be pending after 20 seconds").toEqual(TransactionStatus.pending);
        resolve();
      }, 20_000) }),
      new Promise<void>((resolve) => { setTimeout(async () => {
        const transactionStatus = await getTransaction(transactionId);
        expect([TransactionStatus.success, TransactionStatus.declined], "Transaction should be finished after 120 seconds").toContain(transactionStatus);
        resolve();
      }, 125_000) })
    ]);

  }, 150_000);

  it('should update the transaction status via webhook', async () => {
    let transactionId: number;
    const workingConditions = {
      shouldTimeout: false,
      shouldTimeoutAndWork: false,
      shouldSendWebhook: true,
    }

    await request(app.getHttpServer())
      .post('/transaction')
      .timeout(10_000)
      .send({ amount: 22, workingConditions })
      .then(async (res) => {
        transactionId = res.body.id;
        
        // Stub webhook after 10 seconds
        await new Promise<void>(resolve => setTimeout(async () => {
          await request(app.getHttpServer())
            .post(`/webhookTransaction/${transactionId}`)
            .send({ id: transactionId, status: 'completed' })
            .then(async () => {
              const transactionStatus = await getTransaction(transactionId);
              expect(transactionStatus == TransactionStatus.success || transactionStatus == TransactionStatus.declined).toBe(true);
            });

          resolve();
        }, 10_000));

      });
  }, 45_000);

  it('should handle the timeout when third party drops the transaction totally', async () => {
    let transactionId: number;
    const workingConditions = {
      shouldTimeout: true,
      shouldTimeoutAndWork: false,
      shouldSendWebhook: false,
    }

    await request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 23, workingConditions })
      .then(async (res) => {
        transactionId = res.body.id;

        // Dropped transaction by the third party : after some time the transaction should be failed
        await new Promise<void>(resolve => setTimeout(async () => {
          expect((await getTransaction(transactionId))).toEqual(TransactionStatus.abandon);
          resolve();
        }, 140_000));
      });
  }, 150_000);

  it('should be working in perfect conditions aka the nominal case', async () => {
    const postTransactionResult = await request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 20, workingConditions: {
          shouldTimeout: false,
          shouldSendWebhook: false,
        }});

    const transactionId = postTransactionResult.body.id;
    expect(await getTransaction(transactionId)).toEqual(TransactionStatus.initiated);
        
    await delay(11_000);
    
    const transactionStatus = await getTransaction(transactionId);
    expect(transactionStatus == TransactionStatus.success || transactionStatus == TransactionStatus.declined, 
      "Transaction should be finished but is " + transactionStatus).toBe(true);

  }, 12_000);
});

describe('HTTP POST Transaction on our backend', () => {

  it('should return an initiated transaction with an id, and fast, and add a transactions to the DB', async () => {
    const startTime = performance.now();
    const startTransactions = await transactionService.countAll();
    let transactionId:number;

    await request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 15 })
      .expect(201)
      .expect((res) => {
        expect(res.body.amount).toEqual(15)
        expect(res.body.status).toEqual(1) 
        expect(res.body.id).not.toBeNull();
        transactionId = res.body.id;
        const time = performance.now() - startTime;
        expect(time).toBeLessThan(400);

      })
      .then(async () => {
        const endTransactions = await transactionService.countAll();
        expect(endTransactions).toEqual(startTransactions + 1);

        const transaction = await transactionService.findById(transactionId);
        expect(transaction).not.toBeNull();
        if (transaction != null) {
          expect(transaction.amount).toEqual(15);
        }
    })
  });

  it('should fail if amount is a string', () => {
    return request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 'ahah' })
      .expect(400)
  });

  it('should fail if amount is incorrect', () => {
    return request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: -2 })
      .expect(400)
  });
});

async function getTransaction(transactionId: number): Promise<number> {
  const transaction = await transactionService.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  return transaction.status;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
