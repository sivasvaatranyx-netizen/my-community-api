import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { ROLE_PERMISSIONS } from '../../common/permissions';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AuditService } from '../../integration/telemetry/audit.service';
import { SetActiveDto } from '../../resident/amenities/dto/set-active.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

@ApiTags('Admin')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get('users')
  list(@Query('role') role?: Role) {
    return this.users.findAll(role);
  }

  @Post('users')
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateUserDto) {
    const account = this.users.create(dto);
    this.audit.record(admin.id, 'USER_CREATED', 'user', account.id, { role: account.role });
    return account;
  }

  @Patch('users/:id/role')
  setRole(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    if (id === admin.id) throw new BadRequestException('You cannot change your own role');
    const account = this.users.setRole(id, dto.role);
    this.audit.record(admin.id, 'ROLE_CHANGED', 'user', id, { role: dto.role });
    return account;
  }

  @Patch('users/:id/status')
  setStatus(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    if (id === admin.id) throw new BadRequestException('You cannot deactivate your own account');
    const account = this.users.setActive(id, dto.active);
    this.audit.record(admin.id, dto.active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'user', id);
    return account;
  }

  /** Role -> permission matrix. */
  @Get('roles')
  roles() {
    return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({ role, permissions }));
  }
}
