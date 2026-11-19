import { Module } from '@nestjs/common';
import { IntegrationModule } from '../integration/integration.module';
import { ResidentModule } from '../resident/resident.module';
import { SecurityModule } from '../security/security.module';
import { AdminController } from './admin.controller';
import { AppConfigController, PublicConfigController } from './config/app-config.controller';
import { AppConfigService } from './config/app-config.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [ResidentModule, SecurityModule, IntegrationModule],
  controllers: [
    AdminController, // community management
    UsersController, // user & role management
    AppConfigController, // app configuration
    PublicConfigController,
    ReportsController, // reports & analytics
  ],
  providers: [UsersService, AppConfigService, ReportsService],
  exports: [AppConfigService],
})
export class AdminModule {}
