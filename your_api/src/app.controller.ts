import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';
import { ThirdPartyService } from './thirdParty.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService) {}

  @Post('/transaction')
  async postTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    this.logger.log(`Post transaction ${JSON.stringify(createTransactionDto)}`);
    
    const workingConditions = { ...createTransactionDto.workingConditions };

    const transaction = await this.transactionService.insert(createTransactionDto);

    this.thirdPartyService.postTransaction(transaction);

    return transaction;
  }
}
