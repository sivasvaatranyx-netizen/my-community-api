import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { VisitorSource as PrismaVisitorSource, VisitorStatus as PrismaVisitorStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisitorDto } from '../dto/create-visitor.dto';
import { Resident, Visitor, VisitorStatus } from '../resident.types';

// Temporary tenant context for the existing demo scaffold. Replace this with the
// authenticated user's active society membership before enabling multiple societies.
const DEMO_TENANT_ID = 'demo-tenant';

@Injectable()
export class VisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resident pre-approves a guest or Security records a walk-in in the same visit table. */
  async create(
    resident: Resident,
    dto: CreateVisitorDto,
    source: Visitor['source'],
  ): Promise<Visitor> {
    const record = await this.withTenant(async (tx) => {
      const visitor = await tx.visit.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          residentId: resident.id,
          flat: resident.flat,
          name: dto.name,
          phone: dto.phone,
          purpose: dto.purpose,
          passCode: String(randomInt(100000, 1000000)),
          status: source === 'PRE_APPROVED' ? PrismaVisitorStatus.APPROVED : PrismaVisitorStatus.PENDING,
          source: source as PrismaVisitorSource,
          expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
        },
      });

      // Persist the domain event atomically with the visitor record (transactional outbox).
      await tx.outboxEvent.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          type: 'VISITOR_CREATED',
          payload: {
            visitorId: visitor.id,
            residentId: visitor.residentId,
            flat: visitor.flat,
            source: visitor.source,
            status: visitor.status,
          },
        },
      });
      return visitor;
    });
    return this.toVisitor(record);
  }

  async listForResident(residentId: string): Promise<Visitor[]> {
    const records = await this.withTenant((tx) =>
      tx.visit.findMany({
        where: { tenantId: DEMO_TENANT_ID, residentId },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return records.map((record) => this.toVisitor(record));
  }

  async listAll(): Promise<Visitor[]> {
    const records = await this.withTenant((tx) =>
      tx.visit.findMany({
        where: { tenantId: DEMO_TENANT_ID },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return records.map((record) => this.toVisitor(record));
  }

  async findOne(id: string): Promise<Visitor> {
    const record = await this.withTenant((tx) =>
      tx.visit.findFirst({ where: { id, tenantId: DEMO_TENANT_ID } }),
    );
    if (!record) throw new NotFoundException(`Visitor ${id} not found`);
    return this.toVisitor(record);
  }

  async findApprovedByPassCode(passCode: string): Promise<Visitor> {
    const record = await this.withTenant((tx) =>
      tx.visit.findFirst({
        where: { passCode, tenantId: DEMO_TENANT_ID, status: PrismaVisitorStatus.APPROVED },
      }),
    );
    if (!record) throw new NotFoundException('No approved visitor matches this pass code');
    return this.toVisitor(record);
  }

  async decide(residentId: string, id: string, approve: boolean): Promise<Visitor> {
    return this.withTenant(async (tx) => {
      const updated = await tx.visit.updateMany({
        where: {
          id,
          tenantId: DEMO_TENANT_ID,
          residentId,
          status: PrismaVisitorStatus.PENDING,
        },
        data: { status: approve ? PrismaVisitorStatus.APPROVED : PrismaVisitorStatus.REJECTED },
      });

      if (updated.count === 1) {
        const record = await tx.visit.findFirst({ where: { id, tenantId: DEMO_TENANT_ID } });
        if (!record) throw new NotFoundException(`Visitor ${id} not found`);
        return this.toVisitor(record);
      }

      const existing = await tx.visit.findFirst({ where: { id, tenantId: DEMO_TENANT_ID } });
      if (!existing) throw new NotFoundException(`Visitor ${id} not found`);
      if (existing.residentId !== residentId) throw new ForbiddenException('Not your visitor');
      throw new ForbiddenException(`Visitor is already ${existing.status}`);
    });
  }

  /** Atomic status transition prevents concurrent guards from double-processing a visit. */
  async setStatus(id: string, status: VisitorStatus): Promise<Visitor> {
    return this.withTenant(async (tx) => {
      const allowedFrom = status === VisitorStatus.CHECKED_IN
        ? PrismaVisitorStatus.APPROVED
        : PrismaVisitorStatus.CHECKED_IN;
      const updated = await tx.visit.updateMany({
        where: { id, tenantId: DEMO_TENANT_ID, status: allowedFrom },
        data: { status: status as PrismaVisitorStatus },
      });
      if (updated.count !== 1) {
        const existing = await tx.visit.findFirst({ where: { id, tenantId: DEMO_TENANT_ID } });
        if (!existing) throw new NotFoundException(`Visitor ${id} not found`);
        throw new ForbiddenException(`Cannot change visitor status from ${existing.status} to ${status}`);
      }
      const record = await tx.visit.findFirst({ where: { id, tenantId: DEMO_TENANT_ID } });
      if (!record) throw new NotFoundException(`Visitor ${id} not found`);
      return this.toVisitor(record);
    });
  }

  private withTenant<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${DEMO_TENANT_ID}, true)`;
      return work(tx);
    });
  }

  private toVisitor(record: {
    id: string;
    residentId: string;
    flat: string;
    name: string;
    phone: string;
    purpose: string;
    passCode: string;
    status: PrismaVisitorStatus;
    source: PrismaVisitorSource;
    expectedAt: Date | null;
    createdAt: Date;
  }): Visitor {
    return {
      id: record.id,
      residentId: record.residentId,
      flat: record.flat,
      name: record.name,
      phone: record.phone,
      purpose: record.purpose,
      passCode: record.passCode,
      status: record.status as VisitorStatus,
      source: record.source as Visitor['source'],
      expectedAt: record.expectedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }
}
