import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { IntegrationModule } from '../integration/integration.module';
import { AmenitiesController } from './amenities/amenities.controller';
import { AmenitiesService } from './amenities/amenities.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { ResidentController } from './resident.controller';
import { ComplaintsService } from './services/complaints.service';
import { NoticesService } from './services/notices.service';
import { ResidentsService } from './services/residents.service';
import { VisitorsService } from './services/visitors.service';

@Module({
  imports: [IntegrationModule, PrismaModule],
  controllers: [ResidentController, AmenitiesController, PaymentsController],
  providers: [
    ResidentsService, // Profiles
    VisitorsService,
    ComplaintsService,
    NoticesService,
    AmenitiesService, // Amenities
    PaymentsService, // Payments
  ],
  exports: [
    ResidentsService,
    VisitorsService,
    ComplaintsService,
    NoticesService,
    AmenitiesService,
    PaymentsService,
  ],
})
export class ResidentModule {}
