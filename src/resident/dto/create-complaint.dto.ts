import { IsNotEmpty, IsString } from 'class-validator';

export class CreateComplaintDto {
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() description: string;
}
