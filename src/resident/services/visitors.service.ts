import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { CreateVisitorDto } from '../dto/create-visitor.dto';
import { Resident, Visitor, VisitorStatus } from '../resident.types';

@Injectable()
export class VisitorsService {
  private readonly visitors = new Map<string, Visitor>();

  /** Resident pre-approves a guest (APPROVED) or security logs a walk-in (PENDING). */
  create(resident: Resident, dto: CreateVisitorDto, source: Visitor['source']): Visitor {
    const visitor: Visitor = {
      id: randomUUID(),
      residentId: resident.id,
      flat: resident.flat,
      passCode: String(randomInt(100000, 1000000)),
      status: source === 'PRE_APPROVED' ? VisitorStatus.APPROVED : VisitorStatus.PENDING,
      source,
      createdAt: new Date().toISOString(),
      ...dto,
    };
    this.visitors.set(visitor.id, visitor);
    return visitor;
  }

  listForResident(residentId: string): Visitor[] {
    return [...this.visitors.values()].filter((v) => v.residentId === residentId);
  }

  listAll(): Visitor[] {
    return [...this.visitors.values()];
  }

  findOne(id: string): Visitor {
    const visitor = this.visitors.get(id);
    if (!visitor) throw new NotFoundException(`Visitor ${id} not found`);
    return visitor;
  }

  findApprovedByPassCode(passCode: string): Visitor {
    const visitor = [...this.visitors.values()].find(
      (v) => v.passCode === passCode && v.status === VisitorStatus.APPROVED,
    );
    if (!visitor) throw new NotFoundException('No approved visitor matches this pass code');
    return visitor;
  }

  decide(residentId: string, id: string, approve: boolean): Visitor {
    const visitor = this.findOne(id);
    if (visitor.residentId !== residentId) throw new ForbiddenException('Not your visitor');
    if (visitor.status !== VisitorStatus.PENDING) {
      throw new ForbiddenException(`Visitor is already ${visitor.status}`);
    }
    visitor.status = approve ? VisitorStatus.APPROVED : VisitorStatus.REJECTED;
    return visitor;
  }

  setStatus(id: string, status: VisitorStatus): Visitor {
    const visitor = this.findOne(id);
    visitor.status = status;
    return visitor;
  }
}
