import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TransactionService {

  constructor(private prisma: PrismaService) {}
  
  async countAll(): Promise<number> {
    return this.prisma.transaction.count();
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionDto > {
    return this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        status: TransactionStatus.initiated
      }
    })
  }

  async findById(id: number): Promise<TransactionDto | null> {
    return this.prisma.transaction.findUnique({where: {id: id}});
  }

}
