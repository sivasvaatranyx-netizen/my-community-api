import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { NotificationService } from '../integration/notification.service';
import { PubSubService, Topics } from '../integration/pubsub/pubsub.service';
import { VisitorStatus } from '../resident/resident.types';
import { ResidentsService } from '../resident/services/residents.service';
import { VisitorsService } from '../resident/services/visitors.service';
import { GateActionDto } from './dto/gate-action.dto';
import { VerifyPassDto } from './dto/verify-pass.dto';
import { WalkInVisitorDto } from './dto/walk-in.dto';
import { GateLogService } from './gate-log.service';
import { GatesService } from './gates/gates.service';

/** Visitor management + gate operations (entry/exit). Incidents and gate config live in their own controllers. */
@ApiTags('Security')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('security')
@UseGuards(RolesGuard)
@Roles(Role.SECURITY)
export class SecurityController {
  constructor(
    private readonly residents: ResidentsService,
    private readonly visitors: VisitorsService,
    private readonly gateLog: GateLogService,
    private readonly gates: GatesService,
    private readonly notifications: NotificationService,
    private readonly pubsub: PubSubService,
  ) {}

  // ----- Visitor management -----

  /** Guard logs a visitor with no pre-approval; the resident is notified to approve/reject. */
  @Post('visitors/walk-in')
  async walkIn(@Body() dto: WalkInVisitorDto) {
    const resident = this.residents.findByFlat(dto.flat);
    const visitor = await this.visitors.create(
      resident,
      { name: dto.name, phone: dto.phone, purpose: dto.purpose },
      'WALK_IN',
    );
    this.notifications.send(
      'PUSH',
      resident.id,
      `${dto.name} is at the gate for ${dto.purpose}. Approve or reject.`,
    );
    return visitor;
  }

  @Post('visitors/verify')
  verify(@Body() dto: VerifyPassDto) {
    return this.visitors.findApprovedByPassCode(dto.passCode);
  }

  @Get('visitors/expected')
  async expected() {
    return (await this.visitors.listAll()).filter((v) => v.status === VisitorStatus.APPROVED);
  }

  @Get('visitors/inside')
  async inside() {
    return (await this.visitors.listAll()).filter((v) => v.status === VisitorStatus.CHECKED_IN);
  }

  // ----- Gate operations -----

  @Post('visitors/:id/check-in')
  async checkIn(@CurrentUser() guard: AuthUser, @Param('id') id: string, @Body() dto: GateActionDto) {
    const visitor = await this.visitors.findOne(id);
    if (visitor.status !== VisitorStatus.APPROVED) {
      throw new BadRequestException(`Cannot check in a visitor with status ${visitor.status}`);
    }
    if (dto.gateId) this.gates.assertCanUse(dto.gateId, 'ENTRY');

    await this.visitors.setStatus(id, VisitorStatus.CHECKED_IN);
    this.pubsub.publish(Topics.VISITOR_CHECKED_IN, {
      visitorId: visitor.id,
      residentId: visitor.residentId,
      name: visitor.name,
    });
    return this.gateLog.add(id, 'CHECK_IN', guard.id, dto.gateId, dto.vehicleNumber);
  }

  @Post('visitors/:id/check-out')
  async checkOut(@CurrentUser() guard: AuthUser, @Param('id') id: string, @Body() dto: GateActionDto) {
    const visitor = await this.visitors.findOne(id);
    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      throw new BadRequestException(`Cannot check out a visitor with status ${visitor.status}`);
    }
    if (dto.gateId) this.gates.assertCanUse(dto.gateId, 'EXIT');

    await this.visitors.setStatus(id, VisitorStatus.CHECKED_OUT);
    return this.gateLog.add(id, 'CHECK_OUT', guard.id, dto.gateId, dto.vehicleNumber);
  }

  @Get('gate-log')
  log() {
    return this.gateLog.list();
  }
}
