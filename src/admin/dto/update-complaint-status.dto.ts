import { IsEnum } from 'class-validator';
import { ComplaintStatus } from '../../resident/resident.types';

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus) status: ComplaintStatus;
}
