import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TransactionDto } from './transaction.dto';
import { tap } from 'rxjs';

@Injectable()
export class ThirdPartyService {
  private readonly logger = new Logger(ThirdPartyService.name);
  constructor(private readonly httpService: HttpService) {}

  async postTransaction(transaction: TransactionDto): Promise<void> {
    this.logger.log(`Posting transaction ${JSON.stringify(transaction)}`);  

    if (!transaction.id || transaction.id === 0) {
      throw new Error('Transaction has no id');
    }
    
    //await this.httpService.post(`${process.env.THIRD_PARTY}/`, transaction);
  }

}

export class WorkingConditionsDto {
  timeToAnswer: number;
  forgetToCallbackTheWebhook: boolean;
}
