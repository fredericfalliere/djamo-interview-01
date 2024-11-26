import { IsInt, IsObject, IsOptional, Max, Min } from "class-validator";

export enum TransactionStatus {
    initiated=1,
    success,
    failure
}

export class WorkingConditionsDto {
    shouldTimeout: boolean
    shouldTimeoutAndWork: boolean
    shouldSendWebhook: boolean
}

export class CreateTransactionDto {
    @IsInt()
    @Min(1)
    @Max(100)
    amount: number;

    @IsObject()
    @IsOptional()
    workingConditions: WorkingConditionsDto;
}

export class TransactionDto {
    id:number
    amount:number
    status: TransactionStatus
    created_at: Date
    updated_at: Date
}
