import { IsNotEmpty, IsString } from 'class-validator';

export class WalkInVisitorDto {
  @IsString() @IsNotEmpty() flat: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() purpose: string;
}
