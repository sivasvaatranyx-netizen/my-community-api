import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentGatewayService } from '../../integration/external/payment-gateway.service';
import { NotificationService } from '../../integration/notification.service';
import { PubSubService, Topics } from '../../integration/pubsub/pubsub.service';
import { TasksService } from '../../integration/tasks/tasks.service';
import { ResidentsService } from '../services/residents.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { Invoice, InvoiceStatus, InvoiceView } from './payment.types';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly invoices = new Map<string, Invoice>();

  constructor(
    private readonly residents: ResidentsService,
    private readonly gateway: PaymentGatewayService,
    private readonly notifications: NotificationService,
    private readonly pubsub: PubSubService,
    private readonly tasks: TasksService,
  ) {}

  onModuleInit(): void {
    // Cloud Tasks handler: remind the resident if the invoice is still unpaid
    this.tasks.registerHandler('invoice.reminder', (payload: { invoiceId: string }) => {
      const invoice = this.invoices.get(payload.invoiceId);
      if (invoice && invoice.status === InvoiceStatus.PENDING) {
        this.notifications.send(
          'PUSH',
          invoice.residentId,
          `Reminder: ${invoice.title} (INR ${invoice.amount}) is due on ${invoice.dueDate}.`,
        );
      }
    });
  }

  createInvoice(dto: CreateInvoiceDto): InvoiceView {
    const resident = this.residents.findOne(dto.residentId);
    const invoice: Invoice = {
      id: randomUUID(),
      residentId: resident.id,
      flat: resident.flat,
      title: dto.title,
      amount: dto.amount,
      dueDate: dto.dueDate,
      status: InvoiceStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(invoice.id, invoice);

    this.notifications.send('PUSH', resident.id, `New invoice: ${invoice.title} - INR ${invoice.amount}, due ${invoice.dueDate}.`);

    // Schedule a reminder one day before the due date
    const reminderAt = new Date(new Date(invoice.dueDate).getTime() - DAY_MS);
    if (reminderAt.getTime() > Date.now()) {
      this.tasks.enqueue('invoice.reminder', { invoiceId: invoice.id }, reminderAt, 'payments');
    }
    return this.view(invoice);
  }

  listForResident(residentId: string): InvoiceView[] {
    return this.listAll().filter((i) => i.residentId === residentId);
  }

  listReceipts(residentId: string): InvoiceView[] {
    return this.listForResident(residentId).filter((i) => i.status === InvoiceStatus.PAID);
  }

  listAll(): InvoiceView[] {
    return [...this.invoices.values()].map((i) => this.view(i));
  }

  pay(residentId: string, invoiceId: string, dto: PayInvoiceDto): InvoiceView {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    if (invoice.residentId !== residentId) throw new ForbiddenException('Not your invoice');
    if (invoice.status === InvoiceStatus.PAID) throw new BadRequestException('Invoice is already paid');

    const result = this.gateway.charge({
      amount: invoice.amount,
      method: dto.method,
      reference: invoice.id,
    });
    if (result.status !== 'SUCCESS') throw new BadRequestException('Payment failed. Please try again.');

    invoice.status = InvoiceStatus.PAID;
    invoice.paymentMethod = dto.method;
    invoice.transactionId = result.transactionId;
    invoice.receiptNo = `RCPT-${Date.now()}`;
    invoice.paidAt = result.processedAt;

    this.pubsub.publish(Topics.PAYMENT_COMPLETED, {
      invoiceId: invoice.id,
      residentId: invoice.residentId,
      amount: invoice.amount,
      receiptNo: invoice.receiptNo,
    });
    return this.view(invoice);
  }

  private view(invoice: Invoice): InvoiceView {
    const today = new Date().toISOString().slice(0, 10);
    return { ...invoice, overdue: invoice.status === InvoiceStatus.PENDING && invoice.dueDate.slice(0, 10) < today };
  }
}
