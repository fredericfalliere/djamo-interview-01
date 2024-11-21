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
