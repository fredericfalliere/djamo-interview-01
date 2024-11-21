import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TransactionModel } from './transaction.model';
import { CreateTransactionDto } from './transaction.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/transaction')
  postTransaction(@Body() createTransactionDto: CreateTransactionDto): TransactionModel {

    console.log('createTransactionDto ', createTransactionDto);

    return {
      id: 'test',
      status: 'test'
    }
  }
}
