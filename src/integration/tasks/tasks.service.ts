import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type TaskStatus = 'SCHEDULED' | 'RUNNING' | 'DONE' | 'FAILED';

export interface TaskRecord {
  id: string;
  queue: string;
  name: string;
  payload: unknown;
  runAt: string;
  attempts: number;
  status: TaskStatus;
  lastError?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskHandler = (payload: any) => Promise<void> | void;

/**
 * In-memory stand-in for Google Cloud Tasks: delayed execution with retries and backoff.
 * Tasks are lost on restart; in production, enqueue to Cloud Tasks and expose handlers as HTTP endpoints.
 */
@Injectable()
export class TasksService implements OnModuleDestroy {
  private readonly logger = new Logger(TasksService.name);
  private readonly handlers = new Map<string, TaskHandler>();
  private readonly tasks = new Map<string, TaskRecord>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  private static readonly MAX_TIMEOUT_MS = 2_147_483_647; // setTimeout limit (~24.8 days)
  private static readonly MAX_ATTEMPTS = 3;

  registerHandler(name: string, handler: TaskHandler): void {
    this.handlers.set(name, handler);
  }

  enqueue(name: string, payload: unknown, runAt: Date = new Date(), queue = 'default'): TaskRecord {
    const record: TaskRecord = {
      id: randomUUID(),
      queue,
      name,
      payload,
      runAt: runAt.toISOString(),
      attempts: 0,
      status: 'SCHEDULED',
    };
    this.tasks.set(record.id, record);
    this.schedule(record.id);
    return record;
  }

  list(): TaskRecord[] {
    return [...this.tasks.values()].sort((a, b) => b.runAt.localeCompare(a.runAt));
  }

  onModuleDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }

  private schedule(id: string, retryDelayMs?: number): void {
    const record = this.tasks.get(id);
    if (!record) return;

    const delay = retryDelayMs ?? Math.max(0, new Date(record.runAt).getTime() - Date.now());
    const timer = setTimeout(() => {
      const remaining = new Date(record.runAt).getTime() - Date.now();
      if (retryDelayMs === undefined && remaining > 0) {
        this.schedule(id); // long delay: wait in chunks
        return;
      }
      void this.run(id);
    }, Math.min(delay, TasksService.MAX_TIMEOUT_MS));
    timer.unref();
    this.timers.set(id, timer);
  }

  private async run(id: string): Promise<void> {
    const record = this.tasks.get(id);
    if (!record) return;

    const handler = this.handlers.get(record.name);
    if (!handler) {
      record.status = 'FAILED';
      record.lastError = `No handler registered for ${record.name}`;
      return;
    }

    record.status = 'RUNNING';
    record.attempts += 1;
    try {
      await handler(record.payload);
      record.status = 'DONE';
      record.lastError = undefined;
    } catch (err) {
      record.lastError = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Task ${record.name} attempt ${record.attempts} failed: ${record.lastError}`);
      if (record.attempts < TasksService.MAX_ATTEMPTS) {
        record.status = 'SCHEDULED';
        this.schedule(id, 2 ** record.attempts * 1000);
      } else {
        record.status = 'FAILED';
      }
    }
  }
}
