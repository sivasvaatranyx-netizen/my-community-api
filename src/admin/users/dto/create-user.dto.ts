import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../../../common/role.enum';

export class CreateUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsIn([Role.ADMIN, Role.SECURITY]) role: Role.ADMIN | Role.SECURITY;
}
