import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '../../common/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { Account } from './user.types';

@Injectable()
export class UsersService {
  private readonly accounts = new Map<string, Account>();

  constructor() {
    // Demo seed
    const now = new Date().toISOString();
    this.accounts.set('admin-1', { id: 'admin-1', name: 'Society Admin', phone: '+910000000001', role: Role.ADMIN, active: true, createdAt: now });
    this.accounts.set('guard-1', { id: 'guard-1', name: 'Gate Guard', phone: '+910000000002', role: Role.SECURITY, active: true, createdAt: now });
  }

  create(dto: CreateUserDto): Account {
    const account: Account = { id: randomUUID(), active: true, createdAt: new Date().toISOString(), ...dto };
    this.accounts.set(account.id, account);
    return account;
  }

  findAll(role?: Role): Account[] {
    const all = [...this.accounts.values()];
    return role ? all.filter((a) => a.role === role) : all;
  }

  findOne(id: string): Account {
    const account = this.accounts.get(id);
    if (!account) throw new NotFoundException(`User ${id} not found`);
    return account;
  }

  setRole(id: string, role: Role): Account {
    const account = this.findOne(id);
    account.role = role;
    return account;
  }

  setActive(id: string, active: boolean): Account {
    const account = this.findOne(id);
    account.active = active;
    return account;
  }
}
