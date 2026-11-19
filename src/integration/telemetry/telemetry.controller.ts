import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AuditService } from './audit.service';
import { TelemetryService } from './telemetry.service';

@ApiTags('Integration')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('integration')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class TelemetryController {
  constructor(
    private readonly telemetry: TelemetryService,
    private readonly audit: AuditService,
  ) {}

  @Get('telemetry/metrics')
  metrics() {
    return this.telemetry.snapshot();
  }

  @Get('audit-logs')
  auditLogs(@Query('limit') limit?: string) {
    return this.audit.list(limit ? Number(limit) : 100);
  }
}
