import { Injectable, OnModuleInit } from '@nestjs/common';
import { FcmService } from '../fcm/fcm.service';
import { PubSubService, Topics } from './pubsub.service';

/** Subscribers that turn domain events into push notifications. */
@Injectable()
export class EventHandlersService implements OnModuleInit {
  constructor(
    private readonly pubsub: PubSubService,
    private readonly fcm: FcmService,
  ) {}

  onModuleInit(): void {
    this.pubsub.subscribe(Topics.INCIDENT_REPORTED, (m) => {
      const p = m.payload as { type: string; severity: string; location: string };
      this.fcm.sendToTopic('admins', `Incident: ${p.type}`, `${p.severity} severity at ${p.location}`);
      if (p.severity === 'CRITICAL') {
        this.fcm.sendToTopic('residents', 'Security alert', `Emergency reported at ${p.location}. Follow instructions from security.`);
      }
    });

    this.pubsub.subscribe(Topics.NOTICE_PUBLISHED, (m) => {
      const p = m.payload as { title: string };
      this.fcm.sendToTopic('residents', 'New notice', p.title);
    });

    this.pubsub.subscribe(Topics.VISITOR_CHECKED_IN, (m) => {
      const p = m.payload as { residentId: string; name: string };
      this.fcm.sendToUser(p.residentId, 'Visitor arrived', `${p.name} has entered the community.`);
    });

    this.pubsub.subscribe(Topics.PAYMENT_COMPLETED, (m) => {
      const p = m.payload as { residentId: string; amount: number; receiptNo: string };
      this.fcm.sendToUser(p.residentId, 'Payment received', `INR ${p.amount} received. Receipt ${p.receiptNo}.`);
    });

    this.pubsub.subscribe(Topics.COMPLAINT_UPDATED, (m) => {
      const p = m.payload as { residentId: string; status: string };
      this.fcm.sendToUser(p.residentId, 'Complaint update', `Your complaint is now ${p.status}.`);
    });
  }
}
