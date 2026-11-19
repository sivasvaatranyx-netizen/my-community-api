import { IsIn } from 'class-validator';
import { Role } from '../../../common/role.enum';

export class UpdateRoleDto {
  @IsIn([Role.ADMIN, Role.SECURITY]) role: Role.ADMIN | Role.SECURITY;
}
