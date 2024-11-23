import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TransactionService } from './transaction.service';
import { ValidationPipe } from './validation.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ThirdPartyService } from './thirdParty.service';
import { PrismaService } from './prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
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
