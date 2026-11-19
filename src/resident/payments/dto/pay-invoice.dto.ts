import { IsIn } from 'class-validator';

export class PayInvoiceDto {
  @IsIn(['UPI', 'CARD', 'NETBANKING']) method: 'UPI' | 'CARD' | 'NETBANKING';
}
