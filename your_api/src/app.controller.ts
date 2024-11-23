import { Controller, Get, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';
import { ThirdPartyService } from './thirdParty.service';

@Controller()
export class AppController {
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService) {}

  @Post('/transaction')
  async postTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {

    const transaction = await this.transactionService.create(createTransactionDto);

    this.thirdPartyService.postTransaction(transaction);

    return transaction;
  }
}
