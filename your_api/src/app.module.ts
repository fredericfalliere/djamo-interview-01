import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TransactionService } from './transaction.service';
import { ValidationPipe } from './validation.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ThirdPartyService } from './thirdParty.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    TransactionService,
    ThirdPartyService,
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    }],
})
export class AppModule {}
