// ============================================
// src/billing/billing.controller.ts
// ============================================
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CalculateCostDto } from './dto/calculate-cost.dto';
import { CreateTariffRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTariffRuleDto } from './dto/update-tariff-rule.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaymentStatus } from './enums/payment-status.enum';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ==================== COST CALCULATION ====================

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate shipping cost' })
  @ApiResponse({ status: 200, description: 'Cost calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateCost(@Body() calculateCostDto: CalculateCostDto) {
    return this.billingService.calculateShipmentCost(
      calculateCostDto.origin,
      calculateCostDto.destination,
      calculateCostDto.weight,
      calculateCostDto.volume,
      calculateCostDto.declaredValue,
    );
  }

  // ==================== INVOICE ENDPOINTS ====================

  @Post('invoices')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @CurrentUser() user: any,
  ) {
    console.log(createInvoiceDto);

    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices with filters' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'shipmentId', required: false })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  findAllInvoices(@Query() queryDto: QueryInvoicesDto) {
    return this.billingService.findAllInvoices(queryDto);
  }

  @Get('invoices/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({ status: 200, description: 'Invoice statistics' })
  getInvoiceStats() {
    return this.billingService.getInvoiceStats();
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findInvoice(@Param('id') id: string) {
    return this.billingService.findInvoice(id);
  }

  @Get('invoices/number/:invoiceNumber')
  @ApiOperation({ summary: 'Get invoice by invoice number' })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findInvoiceByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.billingService.findInvoiceByNumber(invoiceNumber);
  }

  @Patch('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  updateInvoice(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.billingService.updateInvoice(id, updateInvoiceDto);
  }

  @Delete('invoices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invoice (use with caution)' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 204, description: 'Invoice deleted' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  removeInvoice(@Param('id') id: string) {
    return this.billingService.removeInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  cancelInvoice(@Param('id') id: string) {
    return this.billingService.cancelInvoice(id);
  }

  // ==================== PAYMENT ENDPOINTS ====================

  @Post('payments')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add payment to invoice' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or payment exceeds balance',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  addPayment(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    // Auto-set processedBy if not provided
    if (!createPaymentDto.processedBy) {
      createPaymentDto.processedBy = user.userId;
    }
    return this.billingService.addPayment(createPaymentDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'invoiceId', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiResponse({ status: 200, description: 'List of payments' })
  findAllPayments(@Query('invoiceId') invoiceId?: string, @Query('method') method?: string) {
    return this.billingService.findAllPayments({ invoiceId, method });
  }

  @Get('payments/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics' })
  getPaymentStats() {
    return this.billingService.getPaymentStats();
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findPayment(@Param('id') id: string) {
    return this.billingService.findPayment(id);
  }

  @Delete('payments/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment (use with extreme caution)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 204, description: 'Payment deleted' })
  removePayment(@Param('id') id: string) {
    return this.billingService.removePayment(id);
  }

  // ==================== TARIFF RULES ENDPOINTS ====================

  @Post('tariffs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create tariff rule' })
  @ApiResponse({ status: 201, description: 'Tariff rule created' })
  createTariffRule(@Body() createTariffRuleDto: CreateTariffRuleDto) {
    return this.billingService.createTariffRule(createTariffRuleDto);
  }

  @Get('tariffs')
  @ApiOperation({ summary: 'Get all tariff rules' })
  @ApiQuery({ name: 'origin', required: false })
  @ApiQuery({ name: 'destination', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of tariff rules' })
  findAllTariffRules(
    @Query('origin') origin?: string,
    @Query('destination') destination?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.billingService.findAllTariffRules({
      origin,
      destination,
      isActive,
    });
  }

  @Get('tariffs/:id')
  @ApiOperation({ summary: 'Get tariff rule by ID' })
  @ApiParam({ name: 'id', description: 'Tariff rule ID' })
  @ApiResponse({ status: 200, description: 'Tariff rule found' })
  @ApiResponse({ status: 404, description: 'Tariff rule not found' })
  findTariffRule(@Param('id') id: string) {
    return this.billingService.findTariffRule(id);
  }

  @Patch('tariffs/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tariff rule' })
  @ApiParam({ name: 'id', description: 'Tariff rule ID' })
  @ApiResponse({ status: 200, description: 'Tariff rule updated' })
  updateTariffRule(@Param('id') id: string, @Body() updateTariffRuleDto: UpdateTariffRuleDto) {
    return this.billingService.updateTariffRule(id, updateTariffRuleDto);
  }

  @Delete('tariffs/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tariff rule' })
  @ApiParam({ name: 'id', description: 'Tariff rule ID' })
  @ApiResponse({ status: 204, description: 'Tariff rule deleted' })
  removeTariffRule(@Param('id') id: string) {
    return this.billingService.removeTariffRule(id);
  }

  // ==================== REPORTING ====================

  @Get('reports/revenue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Revenue report' })
  getRevenueReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.billingService.getRevenueReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/outstanding')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get outstanding payments report' })
  @ApiResponse({ status: 200, description: 'Outstanding payments' })
  getOutstandingPayments() {
    return this.billingService.getOutstandingPayments();
  }

  @Get('reports/payment-methods')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment methods breakdown' })
  @ApiResponse({ status: 200, description: 'Payment methods statistics' })
  getPaymentMethodsBreakdown() {
    return this.billingService.getPaymentMethodsBreakdown();
  }
}
