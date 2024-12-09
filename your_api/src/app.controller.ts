import { Controller, Post, Body, Logger, Param, ParseIntPipe, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, thirdPartyStatusToTransactionStatus, ThirdPartyTransactionDto, TransactionDto } from './transaction.dto';
import { ThirdPartyService } from './thirdParty.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ATTEMPTS_TO_DELAY } from './checkTransaction.processor';
import { TransactionGateway } from './transaction.gateway';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService,
    @InjectQueue('queue') private readonly queue: Queue,
    private readonly transactionGateway: TransactionGateway) {}

  @Get('/transactions')
  async getTransactions(): Promise<TransactionDto[]> {
    this.logger.log('Get /transactions');
    return this.transactionService.findAll();
  }

  @Post('/webhookTransaction/:transactionId')
  async webhookTransaction(@Param('transactionId', ParseIntPipe) transactionId: number, @Body() webhookTransactionDto: ThirdPartyTransactionDto) {
    this.logger.log(`Webhook received for transaction ${transactionId} with status ${webhookTransactionDto.status}`);
    
    await this.transactionService.updateStatus(transactionId, thirdPartyStatusToTransactionStatus(webhookTransactionDto.status));

    this.broadcastTransactionUpdate(transactionId);
  }

  @Post('/transaction')
  async postTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    this.logger.log(`Post /transaction with amount=${createTransactionDto.amount}`);
    
    const workingConditions = { ...createTransactionDto.workingConditions };

    const transaction = await this.transactionService.insert(createTransactionDto);

    this.transactionGateway.broadcastNewTransaction(transaction);

    this.thirdPartyService.postTransaction(transaction, workingConditions, 
      async(transactionId, status) => {
        this.transactionService.updateStatus(transactionId, thirdPartyStatusToTransactionStatus(status));
        
        this.broadcastTransactionUpdate(transactionId);
      },
      (err, transactionId) => {
        this.logger.log(`Queueing transaction ${transactionId} for retry`);
        this.queue.add('check-transaction', 
          { 
            transactionId, 
            attempt: 0,
            startedAt: performance.now(),
          }, 
          { 
            delay: ATTEMPTS_TO_DELAY[0] * 1000 
          }
        );
      });

    return transaction;
  }

  private async broadcastTransactionUpdate(transactionId: number) {
    const transaction = await this.transactionService.findById(transactionId);
    if (transaction) {
      this.transactionGateway.broadcastTransactionUpdate(transaction);
    }
  }
}
