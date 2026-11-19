import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { PubSubService, Topics } from '../../integration/pubsub/pubsub.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentStatus } from './incident.types';
import { IncidentsService } from './incidents.service';

@ApiTags('Security')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('security/incidents')
@UseGuards(RolesGuard)
@Roles(Role.SECURITY, Role.ADMIN)
export class IncidentsController {
  constructor(
    private readonly incidents: IncidentsService,
    private readonly pubsub: PubSubService,
  ) {}

  @Post()
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateIncidentDto) {
    const incident = this.incidents.create(user.id, dto);
    this.pubsub.publish(Topics.INCIDENT_REPORTED, {
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      location: incident.location,
    });
    return incident;
  }

  @Get()
  list(@Query('status') status?: IncidentStatus) {
    return this.incidents.findAll(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.incidents.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    return this.incidents.updateStatus(id, dto.status, user.id, dto.note);
  }
}
