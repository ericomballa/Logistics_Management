import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shipment } from '../shipments/schemas/shipment.schema';
import { Invoice } from '../billing/schemas/invoice.schema';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Shipment.name)
    private shipmentModel: Model<Shipment>,
    @InjectModel(Invoice.name)
    private invoiceModel: Model<Invoice>,
  ) {}

  async getDashboardStats() {
    const totalShipments = await this.shipmentModel.countDocuments().exec();
    const pendingShipments = await this.shipmentModel.countDocuments({ status: ShipmentStatus.PENDING }).exec();
    const inTransit = await this.shipmentModel.countDocuments({ status: ShipmentStatus.IN_TRANSIT }).exec();
    const delivered = await this.shipmentModel.countDocuments({ status: ShipmentStatus.DELIVERED }).exec();

    const invoices = await this.invoiceModel.find().exec();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    return {
      shipments: {
        total: totalShipments,
        pending: pendingShipments,
        inTransit,
        delivered,
      },
      revenue: {
        total: Math.round(totalRevenue),
        paid: Math.round(paidRevenue),
        pending: Math.round(totalRevenue - paidRevenue),
      },
    };
  }

  async getShipmentsByStatus() {
    const data = await this.shipmentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    return data.map((item) => ({
      status: item._id,
      count: item.count,
    }));
  }

  async getShipmentsByOrigin() {
    const data = await this.shipmentModel.aggregate([
      {
        $group: {
          _id: '$origin',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    return data.map((item) => ({
      origin: item._id,
      count: item.count,
    }));
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date) {
    const invoices = await this.invoiceModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).exec();

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    return {
      period: { startDate, endDate },
      totalInvoices: invoices.length,
      totalAmount: Math.round(totalAmount),
      paidAmount: Math.round(paidAmount),
      pendingAmount: Math.round(totalAmount - paidAmount),
    };
  }

  async getAverageDeliveryTime() {
    const deliveredShipments = await this.shipmentModel.find({
      status: ShipmentStatus.DELIVERED,
    }).exec();

    if (deliveredShipments.length === 0) {
      return { averageDays: 0, totalShipments: 0 };
    }

    const totalDays = deliveredShipments.reduce((sum, shipment) => {
      if (shipment.actualDeliveryDate) {
        const diff =
          shipment.actualDeliveryDate.getTime() - new Date(shipment.createdAt as any).getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);

    return {
      averageDays: Math.round(totalDays / deliveredShipments.length),
      totalShipments: deliveredShipments.length,
    };
  }

  async getDailyRevenue(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const invoices = await this.invoiceModel.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).exec();

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    // Group invoices by status
    const byStatus = invoices.reduce((acc, inv) => {
      if (!acc[inv.status]) {
        acc[inv.status] = { count: 0, total: 0, paid: 0 };
      }
      acc[inv.status].count += 1;
      acc[inv.status].total += inv.total;
      acc[inv.status].paid += inv.amountPaid;
      return acc;
    }, {});

    return {
      date: date.toISOString().split('T')[0],
      totalInvoices: invoices.length,
      totalAmount: Math.round(totalAmount),
      paidAmount: Math.round(paidAmount),
      pendingAmount: Math.round(totalAmount - paidAmount),
      byStatus: Object.keys(byStatus).map(status => ({
        status,
        count: byStatus[status].count,
        total: Math.round(byStatus[status].total),
        paid: Math.round(byStatus[status].paid)
      }))
    };
  }
}
