import { IsFQDN, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export enum TransactionStatus {
    initiated=1,
    sent=2,
    success=3,
    declined=4,
    abandon=5,
    unknown=99
}

export function thirdPartyStatusToTransactionStatus(status: string): TransactionStatus {
    if (status == "completed") {
        return TransactionStatus.success;
    } else if (status == "declined") {
        return TransactionStatus.declined;
    } else {
        return TransactionStatus.unknown;
    }
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

export class ThirdPartyTransactionDto {
    id:number
    status: string
}
