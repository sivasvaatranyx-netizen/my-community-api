import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateNoticeDto } from '../dto/create-notice.dto';
import { Notice } from '../resident.types';

@Injectable()
export class NoticesService {
  private readonly notices: Notice[] = [];

  create(postedBy: string, dto: CreateNoticeDto): Notice {
    const notice: Notice = { id: randomUUID(), postedBy, createdAt: new Date().toISOString(), ...dto };
    this.notices.unshift(notice);
    return notice;
  }

  findAll(): Notice[] {
    return this.notices;
  }
}
