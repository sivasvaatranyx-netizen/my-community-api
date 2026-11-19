import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { TelemetryService } from '../telemetry/telemetry.service';

export enum Topics {
  VISITOR_CHECKED_IN = 'visitor.checked_in',
  PAYMENT_COMPLETED = 'payment.completed',
  INCIDENT_REPORTED = 'incident.reported',
  NOTICE_PUBLISHED = 'notice.published',
  COMPLAINT_UPDATED = 'complaint.updated',
}

export interface PubSubMessage {
  id: string;
  topic: string;
  payload: unknown;
  publishedAt: string;
}

/**
 * In-process event bus standing in for Google Cloud Pub/Sub.
 * Publishers never call notification code directly; subscribers react asynchronously.
 */
@Injectable()
export class PubSubService {
  private readonly logger = new Logger(PubSubService.name);
  private readonly emitter = new EventEmitter();
  private readonly messages: PubSubMessage[] = [];

  constructor(private readonly telemetry: TelemetryService) {}

  publish(topic: string, payload: unknown): PubSubMessage {
    const message: PubSubMessage = {
      id: randomUUID(),
      topic,
      payload,
      publishedAt: new Date().toISOString(),
    };
    this.messages.unshift(message);
    if (this.messages.length > 500) this.messages.pop();
    this.telemetry.increment(`pubsub.published.${topic}`);
    setImmediate(() => this.emitter.emit(topic, message));
    return message;
  }

  subscribe(topic: string, handler: (message: PubSubMessage) => void | Promise<void>): void {
    this.emitter.on(topic, async (message: PubSubMessage) => {
      try {
        await handler(message);
      } catch (err) {
        this.logger.error(`Subscriber for ${topic} failed: ${err instanceof Error ? err.message : err}`);
      }
    });
  }

  recent(limit = 50): PubSubMessage[] {
    return this.messages.slice(0, limit);
  }
}
