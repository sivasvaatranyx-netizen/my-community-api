export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Invoice {
  id: string;
  residentId: string;
  flat: string;
  title: string; // e.g. "Maintenance - Nov 2026"
  amount: number; // INR
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paymentMethod?: string;
  transactionId?: string;
  receiptNo?: string;
  paidAt?: string;
  createdAt: string;
}

export type InvoiceView = Invoice & { overdue: boolean };
