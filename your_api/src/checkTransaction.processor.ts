import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bull";
import { TransactionService } from "./transaction.service";
import { ThirdPartyService } from "./thirdParty.service";
import { thirdPartyStatusToTransactionStatus, TransactionStatus } from "./transaction.dto";

export const ATTEMPTS_TO_DELAY = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 5, 8, 13, 21, 30];

@Processor('queue')
export class CheckTransactionProcessor {
    private readonly logger = new Logger(CheckTransactionProcessor.name);
    constructor(private readonly transactionService: TransactionService, 
        private readonly thirdPartyService: ThirdPartyService,
        @InjectQueue('queue') private readonly queue: Queue,) {}
        
        @Process('check-transaction')
        async handleTask(job: Job) {
            let transaction: any = null;
            const { transactionId, attempt } = job.data;
            this.logger.debug(`Checking transaction ${transactionId}`);
            
            try {
                transaction = await this.thirdPartyService.findById(transactionId);
            } catch (error) {
                this.logger.error(`Error finding transaction ${transactionId}`, error);
                return;
            }
            
            if (transaction == null) {
                this.logger.error(`Transaction ${transactionId} not found : will be marked as abandon`);
                await this.transactionService.updateStatus(transactionId, TransactionStatus.abandon);
                return;
            } else {
                if (transaction.status == 'pending') {
                    const newAttempt = attempt + 1;
                    this.queue.add('check-transaction', { transactionId, attempt: newAttempt }, { delay: this.calculateDelayForAttempt(newAttempt) });
                } else {
                    const status = thirdPartyStatusToTransactionStatus(transaction.status);
                    await this.transactionService.updateStatus(transactionId, status);
                }
            }
            
        }

        calculateDelayForAttempt(attempt: number): number {
            if (attempt >= ATTEMPTS_TO_DELAY.length) {
                return ATTEMPTS_TO_DELAY[ATTEMPTS_TO_DELAY.length - 1] * 1000;
            } else {
                return ATTEMPTS_TO_DELAY[attempt] * 1000;
            }
        }
        
    }