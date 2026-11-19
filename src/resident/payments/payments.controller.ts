import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Resident')
@ApiSecurity('x-role')
@ApiSecurity('x-user-id')
@Controller('resident/payments')
@UseGuards(RolesGuard)
@Roles(Role.RESIDENT)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('invoices')
  invoices(@CurrentUser() user: AuthUser) {
    return this.payments.listForResident(user.id);
  }

  @Post('invoices/:id/pay')
  pay(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PayInvoiceDto) {
    return this.payments.pay(user.id, id, dto);
  }

  @Get('receipts')
  receipts(@CurrentUser() user: AuthUser) {
    return this.payments.listReceipts(user.id);
  }
}
