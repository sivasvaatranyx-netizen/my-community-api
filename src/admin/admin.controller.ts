import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { PubSubService, Topics } from '../integration/pubsub/pubsub.service';
import { AuditService } from '../integration/telemetry/audit.service';
import { AmenitiesService } from '../resident/amenities/amenities.service';
import { CreateAmenityDto } from '../resident/amenities/dto/create-amenity.dto';
import { SetActiveDto } from '../resident/amenities/dto/set-active.dto';
import { CreateNoticeDto } from '../resident/dto/create-notice.dto';
import { CreateResidentDto } from '../resident/dto/create-resident.dto';
import { CreateInvoiceDto } from '../resident/payments/dto/create-invoice.dto';
import { PaymentsService } from '../resident/payments/payments.service';
import { ComplaintsService } from '../resident/services/complaints.service';
import { NoticesService } from '../resident/services/notices.service';
import { ResidentsService } from '../resident/services/residents.service';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';

/** Community management: residents, notices, complaints, invoices and amenity catalogue. */
@ApiTags('Admin')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly residents: ResidentsService,
    private readonly notices: NoticesService,
    private readonly complaints: ComplaintsService,
    private readonly payments: PaymentsService,
    private readonly amenities: AmenitiesService,
    private readonly pubsub: PubSubService,
    private readonly audit: AuditService,
  ) {}

  // ----- Residents -----
  @Post('residents')
  createResident(@CurrentUser() admin: AuthUser, @Body() dto: CreateResidentDto) {
    const resident = this.residents.create(dto);
    this.audit.record(admin.id, 'RESIDENT_CREATED', 'resident', resident.id, { flat: resident.flat });
    return resident;
  }

  @Get('residents')
  listResidents() {
    return this.residents.findAll();
  }

  @Delete('residents/:id')
  @HttpCode(204)
  removeResident(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    this.residents.remove(id);
    this.audit.record(admin.id, 'RESIDENT_REMOVED', 'resident', id);
  }

  // ----- Notices -----
  @Post('notices')
  publishNotice(@CurrentUser() admin: AuthUser, @Body() dto: CreateNoticeDto) {
    const notice = this.notices.create(admin.id, dto);
    this.pubsub.publish(Topics.NOTICE_PUBLISHED, { noticeId: notice.id, title: notice.title });
    this.audit.record(admin.id, 'NOTICE_PUBLISHED', 'notice', notice.id);
    return notice;
  }

  @Get('notices')
  listNotices() {
    return this.notices.findAll();
  }

  // ----- Complaints -----
  @Get('complaints')
  listComplaints() {
    return this.complaints.listAll();
  }

  @Patch('complaints/:id/status')
  updateComplaint(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
  ) {
    const complaint = this.complaints.updateStatus(id, dto.status);
    this.pubsub.publish(Topics.COMPLAINT_UPDATED, {
      complaintId: complaint.id,
      residentId: complaint.residentId,
      status: complaint.status,
    });
    this.audit.record(admin.id, 'COMPLAINT_STATUS_CHANGED', 'complaint', id, { status: dto.status });
    return complaint;
  }

  // ----- Invoices (maintenance dues) -----
  @Post('invoices')
  createInvoice(@CurrentUser() admin: AuthUser, @Body() dto: CreateInvoiceDto) {
    const invoice = this.payments.createInvoice(dto);
    this.audit.record(admin.id, 'INVOICE_CREATED', 'invoice', invoice.id, { amount: invoice.amount });
    return invoice;
  }

  @Get('invoices')
  listInvoices() {
    return this.payments.listAll();
  }

  // ----- Amenity catalogue -----
  @Post('amenities')
  createAmenity(@CurrentUser() admin: AuthUser, @Body() dto: CreateAmenityDto) {
    const amenity = this.amenities.create(dto);
    this.audit.record(admin.id, 'AMENITY_CREATED', 'amenity', amenity.id);
    return amenity;
  }

  @Get('amenities')
  listAmenities() {
    return this.amenities.findAll();
  }

  @Patch('amenities/:id/status')
  setAmenityStatus(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: SetActiveDto) {
    const amenity = this.amenities.setActive(id, dto.active);
    this.audit.record(admin.id, 'AMENITY_STATUS_CHANGED', 'amenity', id, { active: dto.active });
    return amenity;
  }
}
