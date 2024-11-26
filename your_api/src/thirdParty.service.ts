import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TransactionDto, WorkingConditionsDto } from './transaction.dto';
import { catchError, of, tap, firstValueFrom } from 'rxjs';

@Injectable()
export class ThirdPartyService {
  private readonly logger = new Logger(ThirdPartyService.name);
  constructor(private readonly httpService: HttpService) {}

  async postTransaction(transaction: TransactionDto, 
    workingConditions: WorkingConditionsDto,
    updateStatusCallback: (status: string) => void): Promise<void> {
    this.logger.debug(`Posting transaction transactionId=${transaction.id} to ${process.env.THIRD_PARTY}/transaction`);

    if (!transaction.id || transaction.id === 0) {
      throw new Error('Transaction has no id');
    }
    
    try {
      await firstValueFrom(
        this.httpService.post(`${process.env.THIRD_PARTY}/transaction`, { 
          id: transaction.id,
          amount: transaction.amount,
          webhookUrl: `${process.env.WEBHOOK_URL}/transaction/${transaction.id}`,
          workingConditions
        }).pipe(
          tap((res) => {
            this.logger.debug(`Transaction posted successfully`, res.data);
            updateStatusCallback(res.data.status);
          }),
          catchError((error) => {
            this.logger.error(`Error posting transaction`);
            throw error;
          })
        )
      );
    } catch (error) {
      this.logger.error(`Error posting transaction`, error);
      throw error;
    }
  }

}