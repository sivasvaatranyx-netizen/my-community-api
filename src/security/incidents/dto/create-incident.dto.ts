import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IncidentSeverity, IncidentType } from '../incident.types';

export class CreateIncidentDto {
  @IsEnum(IncidentType) type: IncidentType;
  @IsEnum(IncidentSeverity) severity: IncidentSeverity;
  @IsString() @IsNotEmpty() location: string;
  @IsString() @IsNotEmpty() description: string;
}
