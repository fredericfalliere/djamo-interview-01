import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TransactionDto } from './transaction.dto';
import { firstValueFrom, map, tap } from 'rxjs';

@Injectable()
export class ThirdPartyService {
  constructor(private readonly httpService: HttpService) {}

  async postTransaction(transaction: TransactionDto): Promise<void> {
    if (!transaction.id || transaction.id === 0) {
      throw new Error('Transaction has no id');
    }
    
    //await this.httpService.post(`${process.env.THIRD_PARTY}/`, transaction);
  }

  async putWorkingConditions(workingConditions: WorkingConditionsDto): Promise<void> {
    await this.httpService.put(`${process.env.THIRD_PARTY}/workingConditions`, workingConditions).pipe(
      tap((response) => {
        console.log("Working conditions updated", response);
      }),
    );
  }
}

export class WorkingConditionsDto {
  timeToAnswer: number;
  forgetToCallbackTheWebhook: boolean;
}
