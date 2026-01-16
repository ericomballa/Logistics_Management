import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { TariffRule } from './entities/tariff-rule.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateTariffRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTariffRuleDto } from './dto/update-tariff-rule.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { PaymentStatus } from './enums/payment-status.enum';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(TariffRule)
    private tariffRepository: Repository<TariffRule>,
  ) {}

  // ==================== COST CALCULATION ====================

  async calculateShipmentCost(
    origin: string,
    destination: string,
    weight: number,
    volume?: number,
    declaredValue?: number,
  ): Promise<any> {
    // Find applicable tariff rule
    const tariff = await this.tariffRepository.findOne({
      where: {
        origin,
        destination,
        isActive: true,
      },
    });

    let baseRate = 5000; // Default base rate in FCFA
    let ratePerKg = 1500; // Default rate per kg
    let ratePerCbm = 8000; // Default rate per cubic meter
    let insuranceRate = 2.5; // Default insurance rate (%)

    if (tariff) {
      baseRate = parseFloat(tariff.baseRate.toString());
      ratePerKg = parseFloat(tariff.ratePerKg.toString());
      ratePerCbm = tariff.ratePerCbm
        ? parseFloat(tariff.ratePerCbm.toString())
        : 0;
      insuranceRate = parseFloat(tariff.insuranceRate.toString());
    }

    // Calculate costs
    const weightCost = weight * ratePerKg;
    const volumeCost = volume ? volume * ratePerCbm : 0;
    const insuranceCost = declaredValue
      ? (declaredValue * insuranceRate) / 100
      : 0;

    const subtotal = baseRate + weightCost + volumeCost + insuranceCost;
    const tax = subtotal * 0.19; // 19% VAT
    const total = subtotal + tax;

    return {
      breakdown: {
        baseRate,
        weightCost,
        volumeCost,
        insuranceCost,
      },
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      total: Math.round(total),
      currency: 'FCFA',
      tariffApplied: tariff ? tariff.name : 'Default rates',
    };
  }

  // ==================== INVOICE METHODS ==================

  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoiceNumber,
      balance: createInvoiceDto.total,
      amountPaid: 0,
      status: PaymentStatus.PENDING,
    });

    return this.invoiceRepository.save(invoice);
  }

  async findAllInvoices(queryDto?: QueryInvoicesDto): Promise<Invoice[]> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .orderBy('invoice.createdAt', 'DESC');

    if (queryDto?.clientId) {
      query.andWhere('invoice.clientId = :clientId', {
        clientId: queryDto.clientId,
      });
    }

    if (queryDto?.shipmentId) {
      query.andWhere('invoice.shipmentId = :shipmentId', {
        shipmentId: queryDto.shipmentId,
      });
    }

    if (queryDto?.status) {
      query.andWhere('invoice.status = :status', { status: queryDto.status });
    }

    if (queryDto?.dateFrom) {
      query.andWhere('invoice.createdAt >= :dateFrom', {
        dateFrom: new Date(queryDto.dateFrom),
      });
    }

    if (queryDto?.dateTo) {
      query.andWhere('invoice.createdAt <= :dateTo', {
        dateTo: new Date(queryDto.dateTo),
      });
    }

    return query.getMany();
  }

  async findInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['payments'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['payments'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceNumber} not found`);
    }

    return invoice;
  }

  async updateInvoice(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findInvoice(id);

    Object.assign(invoice, updateInvoiceDto);

    // Recalculate balance if total changed
    if (updateInvoiceDto.total !== undefined) {
      invoice.balance = updateInvoiceDto.total - invoice.amountPaid;
    }

    return this.invoiceRepository.save(invoice);
  }

  async removeInvoice(id: string): Promise<void> {
    const invoice = await this.findInvoice(id);

    // Check if invoice has payments
    if (invoice.payments && invoice.payments.length > 0) {
      throw new BadRequestException(
        'Cannot delete invoice with existing payments',
      );
    }

    await this.invoiceRepository.remove(invoice);
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findInvoice(id);

    if (invoice.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    invoice.status = PaymentStatus.CANCELLED;
    return this.invoiceRepository.save(invoice);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count invoices this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0);

    const count = await this.invoiceRepository.count({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  // ==================== PAYMENT METHODS ====================

  async addPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.findInvoice(createPaymentDto.invoiceId);

    // Validate payment amount
    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    if (createPaymentDto.amount > invoice.balance) {
      throw new BadRequestException(
        `Payment amount (${createPaymentDto.amount}) exceeds invoice balance (${invoice.balance})`,
      );
    }

    // Create payment
    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice
    invoice.amountPaid =
      parseFloat(invoice.amountPaid.toString()) + createPaymentDto.amount;
    invoice.balance =
      parseFloat(invoice.total.toString()) -
      parseFloat(invoice.amountPaid.toString());

    // Update status
    if (invoice.balance <= 0) {
      invoice.status = PaymentStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = PaymentStatus.PARTIAL;
    }

    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  async findAllPayments(filters?: {
    invoiceId?: string;
    method?: string;
  }): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .orderBy('payment.createdAt', 'DESC');

    if (filters?.invoiceId) {
      query.andWhere('payment.invoiceId = :invoiceId', {
        invoiceId: filters.invoiceId,
      });
    }

    if (filters?.method) {
      query.andWhere('payment.method = :method', { method: filters.method });
    }

    return query.getMany();
  }

  async findPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async removePayment(id: string): Promise<void> {
    const payment = await this.findPayment(id);
    const invoice = payment.invoice;

    // Revert invoice amounts
    invoice.amountPaid =
      parseFloat(invoice.amountPaid.toString()) -
      parseFloat(payment.amount.toString());
    invoice.balance =
      parseFloat(invoice.total.toString()) -
      parseFloat(invoice.amountPaid.toString());

    // Update status
    if (invoice.amountPaid <= 0) {
      invoice.status = PaymentStatus.PENDING;
      invoice.paidAt = null;
    } else if (invoice.balance > 0) {
      invoice.status = PaymentStatus.PARTIAL;
      invoice.paidAt = null;
    }

    await this.invoiceRepository.save(invoice);
    await this.paymentRepository.remove(payment);
  }

  // ==================== TARIFF RULE METHODS ====================

  async createTariffRule(
    createTariffRuleDto: CreateTariffRuleDto,
  ): Promise<TariffRule> {
    const tariff = this.tariffRepository.create(createTariffRuleDto);
    return this.tariffRepository.save(tariff);
  }

  async findAllTariffRules(filters?: {
    origin?: string;
    destination?: string;
    isActive?: boolean;
  }): Promise<TariffRule[]> {
    const query = this.tariffRepository.createQueryBuilder('tariff');

    if (filters?.origin) {
      query.andWhere('tariff.origin = :origin', { origin: filters.origin });
    }

    if (filters?.destination) {
      query.andWhere('tariff.destination = :destination', {
        destination: filters.destination,
      });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('tariff.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return query.orderBy('tariff.name', 'ASC').getMany();
  }

  async findTariffRule(id: string): Promise<TariffRule> {
    const tariff = await this.tariffRepository.findOne({
      where: { id },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff rule with ID ${id} not found`);
    }

    return tariff;
  }

  async updateTariffRule(
    id: string,
    updateTariffRuleDto: UpdateTariffRuleDto,
  ): Promise<TariffRule> {
    const tariff = await this.findTariffRule(id);
    Object.assign(tariff, updateTariffRuleDto);
    return this.tariffRepository.save(tariff);
  }

  async removeTariffRule(id: string): Promise<void> {
    const tariff = await this.findTariffRule(id);
    await this.tariffRepository.remove(tariff);
  }

  // ==================== STATISTICS & REPORTING ====================

  async getInvoiceStats() {
    const totalInvoices = await this.invoiceRepository.count();

    const pending = await this.invoiceRepository.count({
      where: { status: PaymentStatus.PENDING },
    });

    const partial = await this.invoiceRepository.count({
      where: { status: PaymentStatus.PARTIAL },
    });

    const paid = await this.invoiceRepository.count({
      where: { status: PaymentStatus.PAID },
    });

    const cancelled = await this.invoiceRepository.count({
      where: { status: PaymentStatus.CANCELLED },
    });

    const totalAmount = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .where('invoice.status != :status', { status: PaymentStatus.CANCELLED })
      .getRawOne();

    const totalPaid = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'paid')
      .getRawOne();

    const totalOutstanding = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.balance)', 'outstanding')
      .where('invoice.status IN (:...statuses)', {
        statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
      })
      .getRawOne();

    return {
      totalInvoices,
      byStatus: {
        pending,
        partial,
        paid,
        cancelled,
      },
      amounts: {
        totalAmount: parseFloat(totalAmount?.total || '0'),
        totalPaid: parseFloat(totalPaid?.paid || '0'),
        totalOutstanding: parseFloat(totalOutstanding?.outstanding || '0'),
      },
      currency: 'FCFA',
    };
  }

  async getPaymentStats() {
    const totalPayments = await this.paymentRepository.count();

    const totalAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const byMethod = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('payment.method')
      .getRawMany();

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      byMethod: byMethod.map((item) => ({
        method: item.method,
        count: parseInt(item.count),
        amount: parseFloat(item.amount),
      })),
      currency: 'FCFA',
    };
  }

  async getRevenueReport(startDate?: Date, endDate?: Date) {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: PaymentStatus.PAID });

    if (startDate) {
      query.andWhere('invoice.paidAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.paidAt <= :endDate', { endDate });
    }

    const invoices = await query.getMany();

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()),
      0,
    );

    return {
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now',
      },
      totalInvoices: invoices.length,
      totalRevenue: Math.round(totalRevenue),
      averageInvoiceValue:
        invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0,
      currency: 'FCFA',
    };
  }

  async getOutstandingPayments() {
    const invoices = await this.invoiceRepository.find({
      where: [
        { status: PaymentStatus.PENDING },
        { status: PaymentStatus.PARTIAL },
      ],
      order: { dueDate: 'ASC' },
    });

    const overdue = invoices.filter(
      (inv) => inv.dueDate && new Date(inv.dueDate) < new Date(),
    );

    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balance.toString()),
      0,
    );

    const totalOverdue = overdue.reduce(
      (sum, inv) => sum + parseFloat(inv.balance.toString()),
      0,
    );

    return {
      totalInvoices: invoices.length,
      overdueInvoices: overdue.length,
      totalOutstanding: Math.round(totalOutstanding),
      totalOverdue: Math.round(totalOverdue),
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        clientId: inv.clientId,
        balance: parseFloat(inv.balance.toString()),
        dueDate: inv.dueDate,
        isOverdue: inv.dueDate ? new Date(inv.dueDate) < new Date() : false,
      })),
      currency: 'FCFA',
    };
  }

  async getPaymentMethodsBreakdown() {
    const breakdown = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'totalAmount')
      .groupBy('payment.method')
      .getRawMany();

    const total = breakdown.reduce(
      (sum, item) => sum + parseFloat(item.totalAmount),
      0,
    );

    return {
      breakdown: breakdown.map((item) => ({
        method: item.method,
        count: parseInt(item.count),
        totalAmount: parseFloat(item.totalAmount),
        percentage:
          total > 0
            ? ((parseFloat(item.totalAmount) / total) * 100).toFixed(2)
            : 0,
      })),
      totalAmount: Math.round(total),
      currency: 'FCFA',
    };
  }
}
