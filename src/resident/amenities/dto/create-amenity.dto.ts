import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAmenityDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() description: string;
  @IsInt() @Min(1) capacity: number;
  @Matches(HHMM, { message: 'openTime must be HH:mm' }) openTime: string;
  @Matches(HHMM, { message: 'closeTime must be HH:mm' }) closeTime: string;
}
