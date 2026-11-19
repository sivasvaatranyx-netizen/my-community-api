import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVisitorDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() purpose: string;
  @IsOptional() @IsDateString() expectedAt?: string;
}
