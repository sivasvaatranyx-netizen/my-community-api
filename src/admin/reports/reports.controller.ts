import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { ReportsService } from './reports.service';

@ApiTags('Admin')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.overview();
  }

  @Get('reports/visitors')
  visitors() {
    return this.reports.visitorsReport();
  }

  @Get('reports/payments')
  payments() {
    return this.reports.paymentsReport();
  }

  @Get('reports/complaints')
  complaints() {
    return this.reports.complaintsReport();
  }

  @Get('reports/incidents')
  incidents() {
    return this.reports.incidentsReport();
  }

  @Get('reports/amenities')
  amenities() {
    return this.reports.amenitiesReport();
  }
}
