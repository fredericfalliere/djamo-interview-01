import { IsInt, Max, Min } from "class-validator";

export class CreateTransactionDto {

    @IsInt()
    @Min(1)
    @Max(100)
    amount: number
}