import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyPassDto {
  @IsString() @IsNotEmpty() @Length(6, 6) passCode: string;
}
