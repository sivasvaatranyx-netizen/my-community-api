import { IsEnum } from 'class-validator';
import { GateStatus } from '../gate.types';

export class UpdateGateStatusDto {
  @IsEnum(GateStatus) status: GateStatus;
}
