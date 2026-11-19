import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResidentDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() flat: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsEmail() email?: string;
}
