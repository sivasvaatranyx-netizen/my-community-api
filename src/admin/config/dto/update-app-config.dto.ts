import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class FeatureFlagsDto {
  @IsOptional() @IsBoolean() amenityBooking?: boolean;
  @IsOptional() @IsBoolean() onlinePayments?: boolean;
  @IsOptional() @IsBoolean() incidentReporting?: boolean;
}

export class UpdateAppConfigDto {
  @IsOptional() @IsString() @IsNotEmpty() societyName?: string;
  @IsOptional() @IsInt() @Min(1) @Max(168) visitorPassValidityHours?: number;
  @IsOptional() @IsInt() @Min(1) @Max(28) maintenanceDueDay?: number;
  @IsOptional() @IsInt() @Min(1) @Max(60) amenityBookingAdvanceDays?: number;
  @IsOptional() @ValidateNested() @Type(() => FeatureFlagsDto) features?: FeatureFlagsDto;
}
