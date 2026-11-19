import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IncidentStatus } from '../incident.types';

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus) status: IncidentStatus;
  @IsOptional() @IsString() note?: string;
}
