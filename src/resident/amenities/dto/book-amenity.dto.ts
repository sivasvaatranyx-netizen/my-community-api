import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BookAmenityDto {
  @IsString() @IsNotEmpty() amenityId: string;
  @IsDateString() date: string; // YYYY-MM-DD
  @Matches(HHMM, { message: 'startTime must be HH:mm' }) startTime: string;
  @Matches(HHMM, { message: 'endTime must be HH:mm' }) endTime: string;
}
