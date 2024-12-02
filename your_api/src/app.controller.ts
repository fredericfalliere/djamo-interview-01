import { Controller, Post, Body, Logger, Param, ParseIntPipe } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, thirdPartyStatusToTransactionStatus, ThirdPartyTransactionDto, TransactionDto } from './transaction.dto';
import { ThirdPartyService } from './thirdParty.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService,
    @InjectQueue('queue') private readonly queue: Queue,) {}

  @Post('/webhookTransaction/:transactionId')
  async webhookTransaction(@Param('transactionId', ParseIntPipe) transactionId: number, @Body() webhookTransactionDto: ThirdPartyTransactionDto) {
    this.logger.log(`Webhook received for transaction ${transactionId} with status ${webhookTransactionDto.status}`);
    await this.transactionService.updateStatus(transactionId, thirdPartyStatusToTransactionStatus(webhookTransactionDto.status));
  }

  @Post('/transaction')
  async postTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    this.logger.log(`Post /transaction with amount=${createTransactionDto.amount}`);
    
    const workingConditions = { ...createTransactionDto.workingConditions };

    const transaction = await this.transactionService.insert(createTransactionDto);

    this.thirdPartyService.postTransaction(transaction, workingConditions, 
      (transactionId, status) => {
        this.transactionService.updateStatus(transactionId, thirdPartyStatusToTransactionStatus(status));
      },
      (err, transactionId) => {
        this.logger.log(`Queueing transaction ${transactionId} for retry`);
        this.queue.add('check-transaction', { transactionId }, { delay: 122_000 });
      });

    return transaction;
  }
}
