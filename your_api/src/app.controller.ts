import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TransactionModel } from './transaction.model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/transaction')
  postTransaction(): TransactionModel {
    return {
      id: 'test',
      status: 'test'
    }
  }
}
