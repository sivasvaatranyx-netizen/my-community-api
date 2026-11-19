import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  at: string;
}

/** Append-only audit trail for admin / security-sensitive actions (DPDP & compliance). */
@Injectable()
export class AuditService {
  private readonly entries: AuditEntry[] = [];

  record(
    actor: string,
    action: string,
    entity: string,
    entityId?: string,
    details?: Record<string, unknown>,
  ): AuditEntry {
    const entry: AuditEntry = {
      id: randomUUID(),
      actor,
      action,
      entity,
      entityId,
      details,
      at: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    if (this.entries.length > 1000) this.entries.pop();
    return entry;
  }

  list(limit = 100): AuditEntry[] {
    return this.entries.slice(0, limit);
  }
}
