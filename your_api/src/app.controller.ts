import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/transaction')
  postTransaction(@Body() createTransactionDto: CreateTransactionDto): TransactionDto {

    return {
      id: "dummyId",
      amount: createTransactionDto.amount,
      status: TransactionStatus.initiated,
    }
  }
}
