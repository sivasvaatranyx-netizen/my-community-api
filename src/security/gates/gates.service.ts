import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Gate, GateStatus, GateType } from './gate.types';

@Injectable()
export class GatesService {
  private readonly gates = new Map<string, Gate>();

  constructor() {
    const now = new Date().toISOString();
    const seed: Gate[] = [
      { id: 'gate-1', name: 'Main Gate', type: GateType.BOTH, status: GateStatus.OPEN, updatedAt: now },
      { id: 'gate-2', name: 'Service Gate', type: GateType.ENTRY, status: GateStatus.OPEN, updatedAt: now },
      { id: 'gate-3', name: 'Exit Gate', type: GateType.EXIT, status: GateStatus.OPEN, updatedAt: now },
    ];
    seed.forEach((g) => this.gates.set(g.id, g));
  }

  findAll(): Gate[] {
    return [...this.gates.values()];
  }

  findOne(id: string): Gate {
    const gate = this.gates.get(id);
    if (!gate) throw new NotFoundException(`Gate ${id} not found`);
    return gate;
  }

  setStatus(id: string, status: GateStatus): Gate {
    const gate = this.findOne(id);
    gate.status = status;
    gate.updatedAt = new Date().toISOString();
    return gate;
  }

  /** Throws unless the gate is open and allows the requested direction. */
  assertCanUse(id: string, direction: 'ENTRY' | 'EXIT'): Gate {
    const gate = this.findOne(id);
    if (gate.status !== GateStatus.OPEN) throw new BadRequestException(`${gate.name} is closed`);
    if (gate.type !== GateType.BOTH && gate.type !== direction) {
      throw new BadRequestException(`${gate.name} does not allow ${direction.toLowerCase()}`);
    }
    return gate;
  }
}
