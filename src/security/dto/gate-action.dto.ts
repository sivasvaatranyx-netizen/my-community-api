import { IsOptional, IsString } from 'class-validator';

export class GateActionDto {
  @IsOptional() @IsString() gateId?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
}
