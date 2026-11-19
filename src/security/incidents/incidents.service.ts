import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { Incident, IncidentStatus } from './incident.types';

@Injectable()
export class IncidentsService {
  private readonly incidents = new Map<string, Incident>();

  create(reportedBy: string, dto: CreateIncidentDto): Incident {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: randomUUID(),
      reportedBy,
      status: IncidentStatus.OPEN,
      notes: [],
      createdAt: now,
      updatedAt: now,
      ...dto,
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  findAll(status?: IncidentStatus): Incident[] {
    const all = [...this.incidents.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return status ? all.filter((i) => i.status === status) : all;
  }

  findOne(id: string): Incident {
    const incident = this.incidents.get(id);
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    return incident;
  }

  updateStatus(id: string, status: IncidentStatus, by: string, note?: string): Incident {
    const incident = this.findOne(id);
    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    if (note) incident.notes.push({ at: incident.updatedAt, by, note });
    return incident;
  }
}
