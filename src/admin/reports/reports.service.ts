import { Injectable } from '@nestjs/common';
import { AmenitiesService } from '../../resident/amenities/amenities.service';
import { InvoiceStatus } from '../../resident/payments/payment.types';
import { PaymentsService } from '../../resident/payments/payments.service';
import { VisitorStatus } from '../../resident/resident.types';
import { ComplaintsService } from '../../resident/services/complaints.service';
import { NoticesService } from '../../resident/services/notices.service';
import { ResidentsService } from '../../resident/services/residents.service';
import { VisitorsService } from '../../resident/services/visitors.service';
import { IncidentStatus } from '../../security/incidents/incident.types';
import { IncidentsService } from '../../security/incidents/incidents.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly residents: ResidentsService,
    private readonly visitors: VisitorsService,
    private readonly complaints: ComplaintsService,
    private readonly notices: NoticesService,
    private readonly payments: PaymentsService,
    private readonly amenities: AmenitiesService,
    private readonly incidents: IncidentsService,
  ) {}

  overview() {
    const visitors = this.visitors.listAll();
    const invoices = this.payments.listAll();
    return {
      residents: this.residents.findAll().length,
      visitorsTotal: visitors.length,
      visitorsInside: visitors.filter((v) => v.status === VisitorStatus.CHECKED_IN).length,
      openComplaints: this.complaints.listAll().filter((c) => c.status !== 'RESOLVED').length,
      openIncidents: this.incidents.findAll().filter((i) => i.status !== IncidentStatus.RESOLVED).length,
      pendingInvoices: invoices.filter((i) => i.status === InvoiceStatus.PENDING).length,
      outstandingAmount: this.sum(invoices.filter((i) => i.status === InvoiceStatus.PENDING).map((i) => i.amount)),
      noticesPublished: this.notices.findAll().length,
      activeAmenities: this.amenities.findAll(true).length,
    };
  }

  visitorsReport() {
    const visitors = this.visitors.listAll();
    return {
      total: visitors.length,
      byStatus: this.countBy(visitors, (v) => v.status),
      bySource: this.countBy(visitors, (v) => v.source),
      byDay: this.countBy(visitors, (v) => v.createdAt.slice(0, 10)),
    };
  }

  paymentsReport() {
    const invoices = this.payments.listAll();
    const invoiced = this.sum(invoices.map((i) => i.amount));
    const collected = this.sum(invoices.filter((i) => i.status === InvoiceStatus.PAID).map((i) => i.amount));
    return {
      invoiceCount: invoices.length,
      totalInvoiced: invoiced,
      collected,
      outstanding: invoiced - collected,
      collectionRatePercent: invoiced ? Math.round((collected / invoiced) * 10000) / 100 : 0,
      overdueCount: invoices.filter((i) => i.overdue).length,
      byMethod: this.countBy(
        invoices.filter((i) => i.paymentMethod),
        (i) => i.paymentMethod as string,
      ),
    };
  }

  complaintsReport() {
    const complaints = this.complaints.listAll();
    return {
      total: complaints.length,
      byStatus: this.countBy(complaints, (c) => c.status),
      byCategory: this.countBy(complaints, (c) => c.category),
    };
  }

  incidentsReport() {
    const incidents = this.incidents.findAll();
    return {
      total: incidents.length,
      byType: this.countBy(incidents, (i) => i.type),
      bySeverity: this.countBy(incidents, (i) => i.severity),
      byStatus: this.countBy(incidents, (i) => i.status),
    };
  }

  amenitiesReport() {
    const bookings = this.amenities.listAllBookings();
    return {
      totalBookings: bookings.length,
      byAmenity: this.countBy(bookings, (b) => b.amenityName),
      byStatus: this.countBy(bookings, (b) => b.status),
    };
  }

  private countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const k = key(item);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }

  private sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }
}
