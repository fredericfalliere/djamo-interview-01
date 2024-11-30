import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { TransactionService } from "./transaction.service";
import { ThirdPartyService } from "./thirdParty.service";
import { thirdPartyStatusToTransactionStatus, TransactionStatus } from "./transaction.dto";

@Processor('queue')
export class CheckTransactionProcessor {
  private readonly logger = new Logger(CheckTransactionProcessor.name);
  constructor(private readonly transactionService: TransactionService, 
    private readonly thirdPartyService: ThirdPartyService) {}

  @Process('check-transaction')
  async handleTask(job: Job) {
    let transaction: any = null;
    const { transactionId } = job.data;
    this.logger.debug(`Checking transaction ${transactionId}`);

    try {
      transaction = await this.thirdPartyService.findById(transactionId);
    } catch (error) {
      this.logger.error(`Error finding transaction ${transactionId}`, error);
      return;
    }

    if (transaction == null) {
      this.logger.error(`Transaction ${transactionId} not found`);
      return;
    }

    const status = thirdPartyStatusToTransactionStatus(transaction.status);
    await this.transactionService.updateStatus(transactionId, status);
  }

}