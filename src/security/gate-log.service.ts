import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface GateLogEntry {
  id: string;
  visitorId: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  guardId: string;
  gateId?: string;
  vehicleNumber?: string;
  at: string;
}

@Injectable()
export class GateLogService {
  private readonly entries: GateLogEntry[] = [];

  add(
    visitorId: string,
    action: GateLogEntry['action'],
    guardId: string,
    gateId?: string,
    vehicleNumber?: string,
  ): GateLogEntry {
    const entry: GateLogEntry = {
      id: randomUUID(),
      visitorId,
      action,
      guardId,
      gateId,
      vehicleNumber,
      at: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    return entry;
  }

  list(): GateLogEntry[] {
    return this.entries;
  }
}
