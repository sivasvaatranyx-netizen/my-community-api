import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsIn(['SMS', 'PUSH', 'EMAIL']) channel: 'SMS' | 'PUSH' | 'EMAIL';
  @IsString() @IsNotEmpty() to: string;
  @IsString() @IsNotEmpty() message: string;
}
