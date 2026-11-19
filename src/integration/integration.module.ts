import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PaymentGatewayService } from './external/payment-gateway.service';
import { FcmController } from './fcm/fcm.controller';
import { FcmService } from './fcm/fcm.service';
import { IntegrationController } from './integration.controller';
import { NotificationService } from './notification.service';
import { EventHandlersService } from './pubsub/event-handlers.service';
import { PubSubService } from './pubsub/pubsub.service';
import { TasksService } from './tasks/tasks.service';
import { AuditService } from './telemetry/audit.service';
import { LoggingInterceptor } from './telemetry/logging.interceptor';
import { TelemetryController } from './telemetry/telemetry.controller';
import { TelemetryService } from './telemetry/telemetry.service';
import { WebhookService } from './webhook.service';

@Module({
  controllers: [IntegrationController, FcmController, TelemetryController],
  providers: [
    // FCM + notifications
    FcmService,
    NotificationService,
    // Pub/Sub
    PubSubService,
    EventHandlersService,
    // Cloud Tasks
    TasksService,
    // External services
    PaymentGatewayService,
    WebhookService,
    // Telemetry & logs
    TelemetryService,
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [
    FcmService,
    NotificationService,
    PubSubService,
    TasksService,
    PaymentGatewayService,
    WebhookService,
    TelemetryService,
    AuditService,
  ],
})
export class IntegrationModule {}
