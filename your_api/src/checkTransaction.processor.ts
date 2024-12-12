import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bull";
import { TransactionService } from "./transaction.service";
import { ThirdPartyService } from "./thirdParty.service";
import { thirdPartyStatusToTransactionStatus, TransactionStatus } from "./transaction.dto";
import { TransactionGateway } from "./transaction.gateway";

export const ATTEMPTS_TO_DELAY = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 5, 8, 13, 21, 30];
export const FAULT_TOLERANCE_DELAY = 120_000;

@Processor('queue')
export class CheckTransactionProcessor {
    private readonly logger = new Logger(CheckTransactionProcessor.name);
    constructor(private readonly transactionService: TransactionService, 
        private readonly thirdPartyService: ThirdPartyService,
        @InjectQueue('queue') private readonly queue: Queue,
        private readonly transactionGateway: TransactionGateway,) {}
        
        @Process('check-transaction')
        async handleTask(job: Job) {
            let transaction: any = null;
            const { transactionId, attempt, startedAt } = job.data;
            const newAttempt = attempt + 1;
            this.logger.debug(`Checking transaction ${transactionId}`);
            
            try {
                transaction = await this.thirdPartyService.findById(transactionId);
            } catch (error) {
                this.logger.error(`Error finding transaction ${transactionId}`, error);
                return;
            }
            
            if (transaction == null) {
                const elapsedTime = performance.now() - job.data.startedAt;
                if (elapsedTime < FAULT_TOLERANCE_DELAY) {
                    this.logger.debug(`Transaction ${transactionId} not found : will be retried because of our fault tolerance`);
                    await this.transactionService.updateStatus(transactionId, TransactionStatus.pending);
                    this.queue.add('check-transaction', { transactionId, attempt: newAttempt, startedAt }, { delay: this.calculateDelayForAttempt(newAttempt) });
                } else {
                    this.logger.debug(`Transaction ${transactionId} not found : marked as abandon`);
                    await this.transactionService.updateStatus(transactionId, TransactionStatus.abandon);
                }
                return;
            } else {
                if (transaction.status == 'pending') {
                    this.logger.debug(`Transaction ${transactionId} is pending : will be retried`);
                    this.queue.add('check-transaction', { transactionId, attempt: newAttempt, startedAt }, { delay: this.calculateDelayForAttempt(newAttempt) });
                } else {
                    this.logger.debug(`Transaction ${transactionId} is not pending : status=${transaction.status}`);
                    const status = thirdPartyStatusToTransactionStatus(transaction.status);
                    await this.transactionService.updateStatus(transactionId, status);
                }
            }

            transaction = await this.transactionService.findById(transactionId);
            if (transaction) {
                this.transactionGateway.broadcastTransactionUpdate(transaction);
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