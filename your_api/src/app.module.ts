import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TransactionService } from './transaction.service';
import { ValidationPipe } from './validation.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ThirdPartyService } from './thirdParty.service';
import { PrismaService } from './prisma.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CheckTransactionProcessor } from './checkTransaction.processor';

@Module({
  imports: [
    HttpModule.register({ timeout: 10_000 }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379, 
      },
    }),
    BullModule.registerQueue({
      name: 'queue',
    }),
  ],
  controllers: [AppController],
  providers: [
    TransactionService,
    ThirdPartyService,
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    CheckTransactionProcessor,
  ],
})
export class AppModule {}
