import { Controller, Get, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';
import { ThirdPartyService } from './thirdParty.service';

@Controller()
export class AppController {
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService) {}

  @Post('/transaction')
  postTransaction(@Body() createTransactionDto: CreateTransactionDto): TransactionDto {

    return {
      id: "dummyId",
      amount: createTransactionDto.amount,
      status: TransactionStatus.initiated,
    }
  }
}
