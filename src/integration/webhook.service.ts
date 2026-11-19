import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface WebhookEvent {
  id: string;
  source: string;
  payload: unknown;
  receivedAt: string;
}

@Injectable()
export class WebhookService {
  private readonly events: WebhookEvent[] = [];

  record(source: string, payload: unknown): WebhookEvent {
    const event: WebhookEvent = {
      id: randomUUID(),
      source,
      payload,
      receivedAt: new Date().toISOString(),
    };
    this.events.unshift(event);
    return event;
  }

  list(): WebhookEvent[] {
    return this.events;
  }
}
