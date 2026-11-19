import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { Complaint, ComplaintStatus } from '../resident.types';

@Injectable()
export class ComplaintsService {
  private readonly complaints = new Map<string, Complaint>();

  create(residentId: string, dto: CreateComplaintDto): Complaint {
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: randomUUID(),
      residentId,
      status: ComplaintStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      ...dto,
    };
    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  listForResident(residentId: string): Complaint[] {
    return [...this.complaints.values()].filter((c) => c.residentId === residentId);
  }

  listAll(): Complaint[] {
    return [...this.complaints.values()];
  }

  updateStatus(id: string, status: ComplaintStatus): Complaint {
    const complaint = this.complaints.get(id);
    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);
    complaint.status = status;
    complaint.updatedAt = new Date().toISOString();
    return complaint;
  }
}
