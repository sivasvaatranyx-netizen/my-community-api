import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString() @IsNotEmpty() residentId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsNumber() @Min(1) amount: number;
  @IsDateString() dueDate: string;
}
