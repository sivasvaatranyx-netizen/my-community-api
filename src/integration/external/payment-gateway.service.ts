import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ChargeRequest {
  amount: number;
  method: string;
  reference: string;
}

export interface ChargeResult {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  processedAt: string;
}

/** Stub for an external payment gateway (Razorpay / PayU / Cashfree). Always succeeds. */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  charge(request: ChargeRequest): ChargeResult {
    this.logger.log(`Charging INR ${request.amount} via ${request.method} for ${request.reference}`);
    return {
      transactionId: `TXN-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'SUCCESS',
      processedAt: new Date().toISOString(),
    };
  }
}
