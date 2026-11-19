import { Module } from '@nestjs/common';
import { IntegrationModule } from '../integration/integration.module';
import { ResidentModule } from '../resident/resident.module';
import { GateLogService } from './gate-log.service';
import { GatesController } from './gates/gates.controller';
import { GatesService } from './gates/gates.service';
import { IncidentsController } from './incidents/incidents.controller';
import { IncidentsService } from './incidents/incidents.service';
import { SecurityController } from './security.controller';

@Module({
  imports: [ResidentModule, IntegrationModule],
  controllers: [SecurityController, GatesController, IncidentsController],
  providers: [GateLogService, GatesService, IncidentsService],
  exports: [GateLogService, GatesService, IncidentsService],
})
export class SecurityModule {}
