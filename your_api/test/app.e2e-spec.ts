import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransactionService } from './../src/transaction.service';
import { TransactionDto, TransactionStatus } from './../src/transaction.dto';
import { ThirdPartyService } from './../src/thirdParty.service';
import { ReadableByteStreamControllerCallback } from 'stream/web';

let app: INestApplication;
let transactionService: TransactionService;
let thirdPartyService: ThirdPartyService;

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  transactionService = app.get(TransactionService);
  thirdPartyService = app.get(ThirdPartyService);
});

describe('Third party API', () => {
  it('should be working', async () => {
    await thirdPartyService.putWorkingConditions({
      timeToAnswer: 1,
      forgetToCallbackTheWebhook: false,
    });
    const startTime = performance.now();
    let transactionId: number;

    await request(app.getHttpServer())
          .post('/transaction')
          .send({ amount: 20 })
          .expect((res) => {
            transactionId = res.body.id;
            const time = performance.now() - startTime;
            expect(time).toBeLessThan(150);
          })
          .then(async () => {
            
            await new Promise<void>(resolve => setTimeout(async () => {

              const transaction = await transactionService.findById(transactionId);
              if (!transaction) {
                throw new Error('Transaction not found');
              }
              expect(transaction.status).toEqual(TransactionStatus.success);
              resolve();
            }, 100));
          });
  
  });
});

// describe('HTTP POST Transaction on our backend', () => {

//   it('should return an initiated transaction with an id, and fast, and add a transactions to the DB', async () => {
//     const startTime = performance.now();
//     const startTransactions = await transactionService.countAll();
//     let transactionId:number;

//     await request(app.getHttpServer())
//       .post('/transaction')
//       .send({ amount: 15 })
//       .expect(201)
//       .expect((res) => {
//         expect(res.body.amount).toEqual(15)
//         expect(res.body.status).toEqual(0) 
//         expect(res.body.id).not.toBeNull();
//         transactionId = res.body.id;
//         const time = performance.now() - startTime;
//         expect(time).toBeLessThan(400);

//       })
//       .then(async () => {
//         const endTransactions = await transactionService.countAll();
//         expect(endTransactions).toEqual(startTransactions + 1);

//         const transaction = await transactionService.findById(transactionId);
//         expect(transaction).not.toBeNull();
//         if (transaction != null) {
//           expect(transaction.amount).toEqual(15);
//         }
//     })
//   });

//   it('should fail if amount is a string', () => {
//     return request(app.getHttpServer())
//       .post('/transaction')
//       .send({ amount: 'ahah' })
//       .expect(400)
//   });

//   it('should fail if amount is incorrect', () => {
//     return request(app.getHttpServer())
//       .post('/transaction')
//       .send({ amount: -2 })
//       .expect(400)
//   });
// });
