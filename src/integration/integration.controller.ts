import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationService } from './notification.service';
import { PubSubService } from './pubsub/pubsub.service';
import { TasksService } from './tasks/tasks.service';
import { WebhookService } from './webhook.service';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly webhooks: WebhookService,
    private readonly pubsub: PubSubService,
    private readonly tasks: TasksService,
    private readonly config: ConfigService,
  ) {}

  /** Used by Cloud Run / load balancer health checks. */
  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }

  // ----- Notifications -----
  @Post('notifications/test')
  @ApiSecurity('x-role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  sendTest(@Body() dto: SendNotificationDto) {
    return this.notifications.send(dto.channel, dto.to, dto.message);
  }

  @Get('notifications/outbox')
  @ApiSecurity('x-role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  outbox() {
    return this.notifications.getOutbox();
  }

  // ----- Pub/Sub & Tasks (inspection) -----
  @Get('pubsub/messages')
  @ApiSecurity('x-role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  messages() {
    return this.pubsub.recent();
  }

  @Get('tasks')
  @ApiSecurity('x-role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  taskList() {
    return this.tasks.list();
  }

  // ----- Inbound webhooks (external services) -----
  @Post('webhooks/payment')
  receivePaymentWebhook(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const expected = this.config.get<string>('INTEGRATION_WEBHOOK_SECRET', 'change-me');
    if (secret !== expected) throw new UnauthorizedException('Invalid webhook secret');
    return this.webhooks.record('payment', payload);
  }

  @Get('webhooks/events')
  @ApiSecurity('x-role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  events() {
    return this.webhooks.list();
  }
}
