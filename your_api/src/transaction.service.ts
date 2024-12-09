import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateTransactionDto, TransactionDto, TransactionStatus } from './transaction.dto';

@Injectable()
export class TransactionService {

  constructor(private prisma: PrismaService) {}
  
  async countAll(): Promise<number> {
    return this.prisma.transaction.count();
  }

  async findAll(): Promise<TransactionDto[]> {
    return this.prisma.transaction.findMany({
      orderBy: [{ id : 'desc' }]
    });
  }

  async insert(createTransactionDto: CreateTransactionDto): Promise<TransactionDto > {
    return this.prisma.transaction.create({
      data: {
        amount: createTransactionDto.amount,
        status: TransactionStatus.initiated
      }
    })
  }

  async updateStatus(id: number, status: TransactionStatus): Promise<TransactionDto> {
    return this.prisma.transaction.update({where: {id: id}, data: {status: status}});
  }

  async findById(id: number): Promise<TransactionDto | null> {
    return this.prisma.transaction.findUnique({where: {id: id}});
  }

}
