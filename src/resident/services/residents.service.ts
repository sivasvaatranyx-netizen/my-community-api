import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Resident } from '../resident.types';

@Injectable()
export class ResidentsService {
  private readonly residents = new Map<string, Resident>();

  constructor() {
    // Demo seed so the API is usable immediately
    this.residents.set('res-1', {
      id: 'res-1',
      name: 'Demo Resident',
      flat: 'A-101',
      phone: '+910000000000',
      createdAt: new Date().toISOString(),
    });
  }

  create(dto: CreateResidentDto): Resident {
    const resident: Resident = { id: randomUUID(), createdAt: new Date().toISOString(), ...dto };
    this.residents.set(resident.id, resident);
    return resident;
  }

  findAll(): Resident[] {
    return [...this.residents.values()];
  }

  findOne(id: string): Resident {
    const resident = this.residents.get(id);
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return resident;
  }

  findByFlat(flat: string): Resident {
    const resident = this.findAll().find((r) => r.flat.toLowerCase() === flat.toLowerCase());
    if (!resident) throw new NotFoundException(`No resident registered for flat ${flat}`);
    return resident;
  }

  update(id: string, dto: UpdateProfileDto): Resident {
    const resident = this.findOne(id);
    Object.assign(resident, dto);
    return resident;
  }

  remove(id: string): void {
    this.findOne(id);
    this.residents.delete(id);
  }
}
