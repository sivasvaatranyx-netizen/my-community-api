import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AuditService } from '../../integration/telemetry/audit.service';
import { AppConfigService } from './app-config.service';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';

@ApiTags('Admin')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('admin/config')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AppConfigController {
  constructor(
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  get() {
    return this.config.get();
  }

  @Patch()
  update(@CurrentUser() admin: AuthUser, @Body() dto: UpdateAppConfigDto) {
    const updated = this.config.update(dto);
    this.audit.record(admin.id, 'CONFIG_UPDATED', 'app-config', undefined, { changes: dto as Record<string, unknown> });
    return updated;
  }
}

/** Public bootstrap config for the Resident / Guard apps (no auth). */
@ApiTags('Admin')
@Controller('config')
export class PublicConfigController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  get() {
    return this.config.getPublic();
  }
}
