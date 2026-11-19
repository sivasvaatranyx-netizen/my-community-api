import { IsBoolean } from 'class-validator';

export class VisitorDecisionDto {
  @IsBoolean() approve: boolean;
}
