import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VisitorDecisionDto } from './dto/visitor-decision.dto';
import { ComplaintsService } from './services/complaints.service';
import { NoticesService } from './services/notices.service';
import { ResidentsService } from './services/residents.service';
import { VisitorsService } from './services/visitors.service';

@ApiTags('Resident')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('resident')
@UseGuards(RolesGuard)
@Roles(Role.RESIDENT)
export class ResidentController {
  constructor(
    private readonly residents: ResidentsService,
    private readonly visitors: VisitorsService,
    private readonly complaints: ComplaintsService,
    private readonly notices: NoticesService,
  ) {}

  // ----- Profile -----
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.residents.findOne(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.residents.update(user.id, dto);
  }

  // ----- Visitors -----
  @Post('visitors')
  preApproveVisitor(@CurrentUser() user: AuthUser, @Body() dto: CreateVisitorDto) {
    const resident = this.residents.findOne(user.id);
    return this.visitors.create(resident, dto, 'PRE_APPROVED');
  }

  @Get('visitors')
  listVisitors(@CurrentUser() user: AuthUser) {
    return this.visitors.listForResident(user.id);
  }

  @Patch('visitors/:id/decision')
  decideVisitor(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VisitorDecisionDto,
  ) {
    return this.visitors.decide(user.id, id, dto.approve);
  }

  // ----- Complaints -----
  @Post('complaints')
  raiseComplaint(@CurrentUser() user: AuthUser, @Body() dto: CreateComplaintDto) {
    return this.complaints.create(user.id, dto);
  }

  @Get('complaints')
  listComplaints(@CurrentUser() user: AuthUser) {
    return this.complaints.listForResident(user.id);
  }

  // ----- Notices -----
  @Get('notices')
  listNotices() {
    return this.notices.findAll();
  }
}
