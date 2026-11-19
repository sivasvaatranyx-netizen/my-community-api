import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { IntegrationModule } from './integration/integration.module';
import { ResidentModule } from './resident/resident.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ResidentModule,
    SecurityModule,
    AdminModule,
    IntegrationModule,
  ],
})
export class AppModule {}
