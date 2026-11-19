import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { RegisterTokenDto } from '../dto/register-token.dto';
import { FcmService } from './fcm.service';

const ROLE_TOPIC: Record<Role, string> = {
  [Role.RESIDENT]: 'residents',
  [Role.SECURITY]: 'guards',
  [Role.ADMIN]: 'admins',
};

@ApiTags('Integration')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('integration/fcm')
@UseGuards(RolesGuard)
export class FcmController {
  constructor(private readonly fcm: FcmService) {}

  /** Called by the mobile apps after login to register the device's FCM token. */
  @Post('tokens')
  @Roles(Role.RESIDENT, Role.SECURITY, Role.ADMIN)
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterTokenDto) {
    this.fcm.registerToken(user.id, dto.token);
    this.fcm.subscribeToTopic(user.id, ROLE_TOPIC[user.role]);
    return { registered: true, topic: ROLE_TOPIC[user.role] };
  }

  @Get('history')
  @Roles(Role.ADMIN)
  history() {
    return this.fcm.getHistory();
  }
}
