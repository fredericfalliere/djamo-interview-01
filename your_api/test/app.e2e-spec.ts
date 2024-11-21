import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransactionService } from './../src/transaction.service';

describe('HTTP POST Transaction', () => {
  let app: INestApplication;
  let transactionService: TransactionService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    transactionService = app.get(TransactionService);
  });

  it('should return an initiated transaction with an id, and fast, and add a transactions to the DB', async () => {
    const startTime = performance.now();
    const startTransactions = await transactionService.countAllTransactions();
    let transactionId;

    await request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 15 })
      .expect(201)
      .expect((res) => {
        expect(res.body.amount).toEqual(15)
        expect(res.body.status).toEqual(0) 
        expect(res.body.id).toEqual("dummyId");
        const time = performance.now() - startTime;
        expect(time).toBeLessThan(150);
      })
      .then(async () => {
        const endTransactions = await transactionService.countAllTransactions();

        expect(endTransactions).toEqual(startTransactions + 1);
    })
  });

  // it('should fail if amount is a string', () => {
  //   return request(app.getHttpServer())
  //     .post('/transaction')
  //     .send({ amount: 'ahah' })
  //     .expect(400)
  // });

  // it('should fail if amount is incorrect', () => {
  //   return request(app.getHttpServer())
  //     .post('/transaction')
  //     .send({ amount: -2 })
  //     .expect(400)
  // });
});
