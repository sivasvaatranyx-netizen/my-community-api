import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { UpdateGateStatusDto } from './dto/update-gate-status.dto';
import { GatesService } from './gates.service';

@ApiTags('Security')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('security/gates')
@UseGuards(RolesGuard)
@Roles(Role.SECURITY, Role.ADMIN)
export class GatesController {
  constructor(private readonly gates: GatesService) {}

  @Get()
  list() {
    return this.gates.findAll();
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdateGateStatusDto) {
    return this.gates.setStatus(id, dto.status);
  }
}
