import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { thirdPartyStatusToTransactionStatus, ThirdPartyTransactionDto, TransactionDto, TransactionStatus, WorkingConditionsDto } from './transaction.dto';
import { catchError, of, tap, firstValueFrom, map } from 'rxjs';

@Injectable()
export class ThirdPartyService {
  private readonly logger = new Logger(ThirdPartyService.name);
  constructor(private readonly httpService: HttpService) {}

  async findById(transactionId: number): Promise<ThirdPartyTransactionDto | null> {
    try {
      return await firstValueFrom(
        this.httpService.get(`${process.env.THIRD_PARTY}/transaction/${transactionId}`).pipe(
          map((res) => {
            this.logger.debug(`Got transaction ${JSON.stringify(res.data)}`);
            return { id: res.data.id, status: res.data.status };
          })
        )
      );
    } catch (error) {
      this.logger.error(`Error finding transaction ${transactionId}`, error);
      return null;
    }
  }

  async postTransaction(transaction: TransactionDto, workingConditions: WorkingConditionsDto): Promise<TransactionStatus | null> {
    this.logger.debug(`Posting transaction transactionId=${transaction.id} to ${process.env.THIRD_PARTY}/transaction`);

    if (!transaction.id || transaction.id === 0) {
      throw new Error('Transaction has no id');
    }
    
    try {
      return await firstValueFrom(
        this.httpService.post(`${process.env.THIRD_PARTY}/transaction`, { 
          id: transaction.id,
          amount: transaction.amount,
          webhookUrl: `${process.env.WEBHOOK_URL}/webhookTransaction/${transaction.id}`,
          workingConditions
        }).pipe(
          map((res) => {
            this.logger.debug(`Transaction posted successfully`, res.data);
            return thirdPartyStatusToTransactionStatus(res.data.status);
          }),
          catchError((error: HttpException) => {
            this.logger.error(`Error posting transaction`, error);
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