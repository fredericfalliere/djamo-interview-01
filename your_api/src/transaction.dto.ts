import { IsInt, Max, Min } from "class-validator";

export enum TransactionStatus {
    initiated,
    sent,
    success,
    failure
}

export class CreateTransactionDto {
    @IsInt()
    @Min(1)
    @Max(100)
    amount: number
}

export class TransactionDto {
    id:string
    amount:number
    status: TransactionStatus
}