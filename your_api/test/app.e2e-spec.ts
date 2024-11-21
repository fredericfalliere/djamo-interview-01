import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';


describe('HTTP POST Transaction', () => {
  let app: INestApplication;
  

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return an initiated transaction with an id, and fast', () => {
    const startTime = performance.now();

    return request(app.getHttpServer())
      .post('/transaction')
      .send({ amount: 15 })
      .expect(201)
      .expect((res) => {
        expect(res.body.amount).toEqual(15)
        expect(res.body.status).toEqual(0)  // aka initiated
        expect(res.body.id).toEqual("dummyId");
        const time = performance.now() - startTime;
        expect(time).toBeLessThan(150);
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
