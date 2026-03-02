import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { Payment } from './schemas/payment.schema';
import { TariffRule } from './schemas/tariff-rule.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateTariffRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTariffRuleDto } from './dto/update-tariff-rule.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { PaymentStatus as BillingPaymentStatus } from './enums/payment-status.enum';
import { PaymentStatus as DtoPaymentStatus } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '../audit/enums/audit-action-type.enum';
import { Tariff } from './schemas/tariff.schema';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<Invoice>,
    @InjectModel(Payment.name)
    private paymentModel: Model<Payment>,
    @InjectModel(Tariff.name)
    private tariffModel: Model<Tariff>,
    @InjectModel(TariffRule.name)
    private tariffRuleModel: Model<TariffRule>,
    private auditService: AuditService,
  ) {}

  // ==================== COST CALCULATION ====================

  async calculateShipmentCost(
    origin: string,
    destination: string,
    weight: number,
    volume?: number,
    declaredValue?: number,
  ): Promise<any> {
    // Find applicable tariff
    const tariff = await this.tariffModel.findOne({
      origin,
      destination,
      isActive: true,
    }).exec();

    let baseRate = 5000; // Default base rate in FCFA
    let ratePerKg = 1500; // Default rate per kg
    const ratePerCbm = 0; // Default rate per cubic meter
    const insuranceRate = 0; // Default insurance rate

    if (tariff) {
      baseRate = parseFloat(tariff.basePrice.toString());
      ratePerKg = parseFloat(tariff.pricePerKg.toString());
    }

    // Calculate costs
    const weightCost = weight * ratePerKg;
    const volumeCost = volume ? volume * ratePerCbm : 0;
    const insuranceCost = declaredValue ? (declaredValue * insuranceRate) / 100 : 0;

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
      tariffApplied: tariff
        ? tariff.serviceType || tariff.origin + '-' + tariff.destination
        : 'Default rates',
    };
  }

  // ==================== INVOICE METHODS ==================

  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.invoiceModel.create({
      ...createInvoiceDto,
      invoiceNumber,
      balance: createInvoiceDto.total,
      amountPaid: 0,
      status: BillingPaymentStatus.PENDING,
      createdById: createInvoiceDto.createdById ? new Types.ObjectId(createInvoiceDto.createdById) : undefined,
      shipmentId: createInvoiceDto.shipmentId ? new Types.ObjectId(createInvoiceDto.shipmentId) : undefined,
      clientId: createInvoiceDto.clientId ? new Types.ObjectId(createInvoiceDto.clientId) : undefined,
    });

    const savedInvoice = await invoice.save();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'INVOICE',
      savedInvoice._id.toString(),
      'System',
      savedInvoice.createdById?.toString() || null,
      `Created invoice ${savedInvoice.invoiceNumber} for shipment ${savedInvoice.shipmentId || 'N/A'}`,
    );

    return savedInvoice;
  }

  async findAllInvoices(
    queryDto?: QueryInvoicesDto,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const page = parseInt(queryDto?.page) || 1;
    const limit = parseInt(queryDto?.limit) || 10;
    const offset = (page - 1) * limit;

    const query: any = {};

    if (queryDto?.clientId) {
      query.clientId = new Types.ObjectId(queryDto.clientId);
    }

    if (queryDto?.shipmentId) {
      query.shipmentId = new Types.ObjectId(queryDto.shipmentId);
    }

    if (queryDto?.status) {
      query.status = queryDto.status;
    }

    if (queryDto?.dateFrom) {
      query.createdAt = { $gte: new Date(queryDto.dateFrom) };
    }

    if (queryDto?.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: new Date(queryDto.dateTo) };
    }

    if (queryDto?.search) {
      query.invoiceNumber = new RegExp(queryDto.search, 'i');
    }

    const [data, total] = await Promise.all([
      this.invoiceModel
        .find(query)
        .populate('clientId', 'name email')
        .populate('shipmentId', 'trackingNumber')
        .populate('createdById', 'name email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.invoiceModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('payments')
      .populate('shipmentId')
      .populate('clientId')
      .populate('createdById')
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceModel
      .findOne({ invoiceNumber })
      .populate('payments')
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceNumber} not found`);
    }

    return invoice;
  }

  async updateInvoice(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
    performedBy: string,
  ): Promise<Invoice> {
    const invoice = await this.findInvoice(id);

    // Recalculate balance if total changed
    if (updateInvoiceDto.total !== undefined) {
      invoice.balance = updateInvoiceDto.total - invoice.amountPaid;
    }

    // Update status based on amount paid vs total
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = BillingPaymentStatus.PAID;
    } else if (invoice.amountPaid > 0) {
      invoice.status = BillingPaymentStatus.PARTIAL;
    } else if (
      invoice.dueDate &&
      new Date() > new Date(invoice.dueDate) &&
      invoice.status !== BillingPaymentStatus.PAID
    ) {
      invoice.status = BillingPaymentStatus.OVERDUE;
    } else {
      invoice.status = BillingPaymentStatus.PENDING;
    }

    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { $set: { ...updateInvoiceDto, status: invoice.status, balance: invoice.balance } },
        { new: true, runValidators: true },
      )
      .exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.UPDATE,
      'INVOICE',
      updatedInvoice._id.toString(),
      performedBy,
      userId,
      `Updated invoice ${updatedInvoice.invoiceNumber} status to ${updatedInvoice.status}`,
    );

    return updatedInvoice;
  }

  async createPayment(createPaymentDto: CreatePaymentDto, userId: string, performedBy: string) {
    if (!createPaymentDto.invoiceId) {
      throw new BadRequestException('Invoice ID is required for payment');
    }
    console.log(createPaymentDto);

    const invoice = await this.findInvoice(createPaymentDto.invoiceId);

    // Validate payment amount
    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    if (createPaymentDto.amount > invoice.balance) {
      throw new BadRequestException(
        `Payment amount (${createPaymentDto.amount}) exceeds invoice balance (${invoice.balance}). Remaining balance: ${invoice.balance}`,
      );
    }

    // Create payment
    const payment = await this.paymentModel.create({
      amount: createPaymentDto.amount,
      method: createPaymentDto.method,
      status: createPaymentDto.status || DtoPaymentStatus.COMPLETED,
      transactionId: createPaymentDto.transactionId || null,
      notes: createPaymentDto.notes || null,
      currency: createPaymentDto.currency || 'XAF',
      reference: createPaymentDto.reference || null,
      invoiceId: new Types.ObjectId(createPaymentDto.invoiceId),
      processedById: userId ? new Types.ObjectId(userId) : undefined,
    });

    const savedPayment = await payment.save();

    invoice.amountPaid = Number(invoice.amountPaid) + payment.amount;
    invoice.balance = Number(invoice.total) - Number(invoice.amountPaid);

    // Update invoice status
    if (invoice.balance <= 0) {
      invoice.status = BillingPaymentStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = BillingPaymentStatus.PARTIAL;
    } else if (
      invoice.dueDate &&
      new Date() > new Date(invoice.dueDate) &&
      invoice.status !== BillingPaymentStatus.PAID
    ) {
      invoice.status = BillingPaymentStatus.OVERDUE;
    } else {
      invoice.status = BillingPaymentStatus.PENDING;
    }

    await this.invoiceModel.findByIdAndUpdate(invoice._id, {
      $set: {
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
        paidAt: invoice.paidAt,
      },
    }).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'PAYMENT',
      savedPayment._id.toString(),
      performedBy,
      userId,
      `Recorded payment of ${createPaymentDto.amount} XAF for invoice ${invoice.invoiceNumber}. Remaining balance: ${invoice.balance}`,
    );

    return savedPayment;
  }

  async removeInvoice(id: string): Promise<void> {
    const invoice = await this.findInvoice(id);

    // Check if invoice has payments
    const payments = await this.paymentModel.find({ invoiceId: new Types.ObjectId(id) }).exec();
    if (payments && payments.length > 0) {
      throw new BadRequestException('Cannot delete invoice with existing payments');
    }

    await this.invoiceModel.findByIdAndDelete(id).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.DELETE,
      'INVOICE',
      invoice._id.toString(),
      'System',
      invoice.createdById?.toString() || null,
      `Deleted invoice ${invoice.invoiceNumber}`,
    );
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findInvoice(id);

    if (invoice.status === BillingPaymentStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { $set: { status: BillingPaymentStatus.CANCELLED } },
        { new: true },
      )
      .exec();

    return updatedInvoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count invoices this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0);

    const count = await this.invoiceModel.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }).exec();

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
        `Payment amount (${createPaymentDto.amount}) exceeds invoice balance (${invoice.balance}). Remaining balance: ${invoice.balance}`,
      );
    }

    // Create payment
    const payment = await this.paymentModel.create({
      ...createPaymentDto,
      invoiceId: new Types.ObjectId(createPaymentDto.invoiceId),
    });

    const savedPayment = await payment.save();

    // Update invoice
    invoice.amountPaid = parseFloat(invoice.amountPaid.toString()) + createPaymentDto.amount;
    invoice.balance =
      parseFloat(invoice.total.toString()) - parseFloat(invoice.amountPaid.toString());

    // Update status
    if (invoice.balance <= 0) {
      invoice.status = BillingPaymentStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = BillingPaymentStatus.PARTIAL;
    } else if (
      invoice.dueDate &&
      new Date() > new Date(invoice.dueDate) &&
      invoice.status !== BillingPaymentStatus.PAID
    ) {
      invoice.status = BillingPaymentStatus.OVERDUE;
    } else {
      invoice.status = BillingPaymentStatus.PENDING;
    }

    await this.invoiceModel.findByIdAndUpdate(invoice._id, {
      $set: {
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
        paidAt: invoice.paidAt,
      },
    }).exec();

    return savedPayment;
  }

  async findAllPayments(filters?: { invoiceId?: string; method?: string }): Promise<Payment[]> {
    const query: any = {};

    if (filters?.invoiceId) {
      query.invoiceId = new Types.ObjectId(filters.invoiceId);
    }

    if (filters?.method) {
      query.method = filters.method;
    }

    return this.paymentModel
      .find(query)
      .populate('invoiceId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPayment(id: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('invoiceId')
      .exec();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async getInvoicePaymentHistory(invoiceId: string): Promise<Payment[]> {
    const invoice = await this.findInvoice(invoiceId);

    return await this.paymentModel
      .find({ invoiceId: invoice._id })
      .sort({ createdAt: 1 })
      .exec();
  }

  async getInvoicePaymentSummary(invoiceId: string): Promise<{
    total: number;
    amountPaid: number;
    balance: number;
    status: BillingPaymentStatus;
    payments: Payment[];
  }> {
    const invoice = await this.findInvoice(invoiceId);
    const payments = await this.getInvoicePaymentHistory(invoiceId);

    let totalPayments = 0;
    for (const payment of payments) {
      totalPayments += parseInt(payment.amount.toString());
    }

    return {
      total: invoice.total,
      amountPaid: totalPayments,
      balance: invoice.balance,
      status: invoice.status,
      payments,
    };
  }

  async removePayment(id: string): Promise<void> {
    const payment = await this.findPayment(id);
    const invoice = await this.findInvoice(payment.invoiceId.toString());

    // Revert invoice amounts
    invoice.amountPaid = Number(invoice.amountPaid) - Number(payment.amount);
    invoice.balance = Number(invoice.total) - Number(invoice.amountPaid);

    // Update status based on remaining balance
    if (invoice.balance <= 0) {
      invoice.status = BillingPaymentStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = BillingPaymentStatus.PARTIAL;
      invoice.paidAt = null;
    } else if (invoice.dueDate && new Date() > new Date(invoice.dueDate)) {
      invoice.status = BillingPaymentStatus.OVERDUE;
      invoice.paidAt = null;
    } else {
      invoice.status = BillingPaymentStatus.PENDING;
      invoice.paidAt = null;
    }

    await this.invoiceModel.findByIdAndUpdate(invoice._id, {
      $set: {
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
        paidAt: invoice.paidAt,
      },
    }).exec();

    await this.paymentModel.findByIdAndDelete(id).exec();
  }

  // ==================== TARIFF RULE METHODS ====================

  async createTariffRule(
    createTariffRuleDto: CreateTariffRuleDto,
    userId: string,
    performedBy: string,
  ): Promise<TariffRule> {
    const rule = await this.tariffRuleModel.create(createTariffRuleDto);
    const savedRule = await rule.save();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'TARIFF_RULE',
      savedRule._id.toString(),
      performedBy,
      userId,
      `Created tariff rule from ${savedRule.origin} to ${savedRule.destination}`,
    );

    return savedRule;
  }

  async findAllTariffRules(filters?: {
    origin?: string;
    destination?: string;
    isActive?: boolean;
  }): Promise<TariffRule[]> {
    const query: any = {};

    if (filters?.origin) {
      query.origin = filters.origin;
    }

    if (filters?.destination) {
      query.destination = filters.destination;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return this.tariffRuleModel.find(query).sort({ name: 1 }).exec();
  }

  async findTariffRule(id: string): Promise<TariffRule> {
    const rule = await this.tariffRuleModel.findById(id).exec();

    if (!rule) {
      throw new NotFoundException(`Tariff rule with ID ${id} not found`);
    }

    return rule;
  }

  async updateTariffRule(
    id: string,
    updateTariffRuleDto: UpdateTariffRuleDto,
    userId: string,
    performedBy: string,
  ): Promise<TariffRule> {
    const rule = await this.findTariffRule(id);

    const updatedRule = await this.tariffRuleModel
      .findByIdAndUpdate(
        id,
        { $set: updateTariffRuleDto },
        { new: true, runValidators: true },
      )
      .exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.UPDATE,
      'TARIFF_RULE',
      updatedRule._id.toString(),
      performedBy,
      userId,
      `Updated tariff rule from ${updatedRule.origin} to ${updatedRule.destination}`,
    );

    return updatedRule;
  }

  async removeTariffRule(id: string, userId: string, performedBy: string): Promise<void> {
    const rule = await this.findTariffRule(id);
    await this.tariffRuleModel.findByIdAndDelete(id).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.DELETE,
      'TARIFF_RULE',
      rule._id.toString(),
      performedBy,
      userId,
      `Deleted tariff rule from ${rule.origin} to ${rule.destination}`,
    );
  }

  // ==================== STATISTICS & REPORTING ====================

  async getInvoiceStats() {
    const totalInvoices = await this.invoiceModel.countDocuments().exec();

    const pending = await this.invoiceModel.countDocuments({ status: BillingPaymentStatus.PENDING }).exec();
    const partial = await this.invoiceModel.countDocuments({ status: BillingPaymentStatus.PARTIAL }).exec();
    const paid = await this.invoiceModel.countDocuments({ status: BillingPaymentStatus.PAID }).exec();
    const cancelled = await this.invoiceModel.countDocuments({ status: BillingPaymentStatus.CANCELLED }).exec();

    const invoices = await this.invoiceModel.find({ status: { $ne: BillingPaymentStatus.CANCELLED } }).exec();
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    const paidInvoices = await this.invoiceModel.find({ status: BillingPaymentStatus.PAID }).exec();
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    const outstandingInvoices = await this.invoiceModel.find({
      status: { $in: [BillingPaymentStatus.PENDING, BillingPaymentStatus.PARTIAL] },
    }).exec();
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.balance, 0);

    return {
      totalInvoices,
      byStatus: {
        pending,
        partial,
        paid,
        cancelled,
      },
      amounts: {
        totalAmount: Math.round(totalAmount),
        totalPaid: Math.round(totalPaid),
        totalOutstanding: Math.round(totalOutstanding),
      },
      currency: 'FCFA',
    };
  }

  async getPaymentStats() {
    const totalPayments = await this.paymentModel.countDocuments().exec();

    const payments = await this.paymentModel.find().exec();
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const byMethod = await this.paymentModel.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]).exec();

    return {
      totalPayments,
      totalAmount: Math.round(totalAmount),
      byMethod: byMethod.map((item) => ({
        method: item._id,
        count: item.count,
        amount: Math.round(item.amount),
      })),
      currency: 'FCFA',
    };
  }

  async getRevenueReport(startDate?: Date, endDate?: Date) {
    const query: any = { status: BillingPaymentStatus.PAID };

    if (startDate) {
      query.paidAt = { $gte: startDate };
    }

    if (endDate) {
      query.paidAt = { ...query.paidAt, $lte: endDate };
    }

    const invoices = await this.invoiceModel.find(query).exec();

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return {
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now',
      },
      totalInvoices: invoices.length,
      totalRevenue: Math.round(totalRevenue),
      averageInvoiceValue: invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0,
      currency: 'FCFA',
    };
  }

  async getOutstandingPayments() {
    const invoices = await this.invoiceModel.find({
      status: { $in: [BillingPaymentStatus.PENDING, BillingPaymentStatus.PARTIAL] },
    }).sort({ dueDate: 1 }).exec();

    const overdue = invoices.filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date());

    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const totalOverdue = overdue.reduce((sum, inv) => sum + inv.balance, 0);

    return {
      totalInvoices: invoices.length,
      overdueInvoices: overdue.length,
      totalOutstanding: Math.round(totalOutstanding),
      totalOverdue: Math.round(totalOverdue),
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        clientId: inv.clientId?.toString(),
        balance: inv.balance,
        dueDate: inv.dueDate,
        isOverdue: inv.dueDate ? new Date(inv.dueDate) < new Date() : false,
      })),
      currency: 'FCFA',
    };
  }

  async getPaymentMethodsBreakdown() {
    const breakdown = await this.paymentModel.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]).exec();

    const total = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      breakdown: breakdown.map((item) => ({
        method: item._id,
        count: item.count,
        totalAmount: Math.round(item.totalAmount),
        percentage: total > 0 ? ((item.totalAmount / total) * 100).toFixed(2) : '0',
      })),
      total: Math.round(total),
      currency: 'FCFA',
    };
  }

  // ==================== TARIFF METHODS ====================

  async createTariff(
    createTariffDto: CreateTariffDto,
    userId: string,
    performedBy: string,
  ): Promise<Tariff> {
    const tariff = await this.tariffModel.create(createTariffDto);
    const savedTariff = await tariff.save();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'TARIFF',
      savedTariff._id.toString(),
      performedBy,
      userId,
      `Created tariff from ${savedTariff.origin} to ${savedTariff.destination}`,
    );

    return savedTariff;
  }

  async findAllTariffs(filters?: { isActive?: boolean }): Promise<Tariff[]> {
    const query: any = {};

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return this.tariffModel.find(query).exec();
  }

  async findTariff(id: string): Promise<Tariff> {
    const tariff = await this.tariffModel.findById(id).exec();

    if (!tariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }

    return tariff;
  }

  async updateTariff(
    id: string,
    updateTariffDto: UpdateTariffDto,
    userId: string,
    performedBy: string,
  ): Promise<Tariff> {
    const updatedTariff = await this.tariffModel
      .findByIdAndUpdate(
        id,
        { $set: updateTariffDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedTariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.UPDATE,
      'TARIFF',
      updatedTariff._id.toString(),
      performedBy,
      userId,
      `Updated tariff from ${updatedTariff.origin} to ${updatedTariff.destination}`,
    );

    return updatedTariff;
  }

  async removeTariff(id: string, userId: string, performedBy: string): Promise<void> {
    const tariff = await this.findTariff(id);
    await this.tariffModel.findByIdAndDelete(id).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.DELETE,
      'TARIFF',
      tariff._id.toString(),
      performedBy,
      userId,
      `Deleted tariff from ${tariff.origin} to ${tariff.destination}`,
    );
  }
}
