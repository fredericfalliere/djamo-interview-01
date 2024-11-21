import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransactionService {

  constructor(private prisma: PrismaService) {}
  
  async countAllTransactions(): Promise<number> {
    return this.prisma.transactions.count();
  }
}
