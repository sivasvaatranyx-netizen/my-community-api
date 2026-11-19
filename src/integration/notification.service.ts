import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FcmService } from './fcm/fcm.service';

export type NotificationChannel = 'SMS' | 'PUSH' | 'EMAIL';

export interface Notification {
  id: string;
  channel: NotificationChannel;
  to: string;
  message: string;
  status: 'QUEUED' | 'SENT';
  createdAt: string;
}

/**
 * Channel facade. PUSH is delegated to FCM; SMS and EMAIL are stubs
 * (plug in MSG91 / Twilio and SendGrid / SES).
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly outbox: Notification[] = [];

  constructor(private readonly fcm: FcmService) {}

  send(channel: NotificationChannel, to: string, message: string): Notification {
    if (channel === 'PUSH') this.fcm.sendToUser(to, 'MyHome', message);

    const notification: Notification = {
      id: randomUUID(),
      channel,
      to,
      message,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
    this.outbox.unshift(notification);
    if (this.outbox.length > 500) this.outbox.pop();
    this.logger.log(`[${channel}] -> ${to}: ${message}`);
    return notification;
  }

  getOutbox(): Notification[] {
    return this.outbox;
  }
}
