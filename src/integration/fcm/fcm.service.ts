import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PushMessage {
  id: string;
  target: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  deviceCount: number;
  sentAt: string;
}

/**
 * Stub for Firebase Cloud Messaging.
 * Replace the bodies of sendToUser/sendToTopic with firebase-admin `messaging().send(...)`.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly tokens = new Map<string, Set<string>>(); // userId -> device tokens
  private readonly topics = new Map<string, Set<string>>(); // topic -> userIds
  private readonly history: PushMessage[] = [];

  registerToken(userId: string, token: string): void {
    const set = this.tokens.get(userId) ?? new Set<string>();
    set.add(token);
    this.tokens.set(userId, set);
  }

  subscribeToTopic(userId: string, topic: string): void {
    const set = this.topics.get(topic) ?? new Set<string>();
    set.add(userId);
    this.topics.set(topic, set);
  }

  sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): PushMessage {
    const deviceCount = this.tokens.get(userId)?.size ?? 0;
    return this.record(`user:${userId}`, title, body, deviceCount, data);
  }

  sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): PushMessage {
    let deviceCount = 0;
    for (const userId of this.topics.get(topic) ?? []) {
      deviceCount += this.tokens.get(userId)?.size ?? 0;
    }
    return this.record(`topic:${topic}`, title, body, deviceCount, data);
  }

  getHistory(): PushMessage[] {
    return this.history;
  }

  private record(
    target: string,
    title: string,
    body: string,
    deviceCount: number,
    data?: Record<string, string>,
  ): PushMessage {
    const message: PushMessage = {
      id: randomUUID(),
      target,
      title,
      body,
      data,
      deviceCount,
      sentAt: new Date().toISOString(),
    };
    this.history.unshift(message);
    if (this.history.length > 500) this.history.pop();
    this.logger.log(`[FCM] ${target} (${deviceCount} devices): ${title} - ${body}`);
    return message;
  }
}
