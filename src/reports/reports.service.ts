import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async getDashboardStats() {
    const totalShipments = await this.shipmentsRepository.count();
    const pendingShipments = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.PENDING },
    });
    const inTransit = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.IN_TRANSIT },
    });
    const delivered = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.DELIVERED },
    });

    const totalRevenue = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .getRawOne();

    const paidRevenue = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'paid')
      .getRawOne();

    return {
      shipments: {
        total: totalShipments,
        pending: pendingShipments,
        inTransit,
        delivered,
      },
      revenue: {
        total: parseFloat(totalRevenue?.total || '0'),
        paid: parseFloat(paidRevenue?.paid || '0'),
        pending:
          parseFloat(totalRevenue?.total || '0') -
          parseFloat(paidRevenue?.paid || '0'),
      },
    };
  }

  async getShipmentsByStatus() {
    const data = await this.shipmentsRepository
      .createQueryBuilder('shipment')
      .select('shipment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('shipment.status')
      .getRawMany();

    return data.map((item) => ({
      status: item.status,
      count: parseInt(item.count),
    }));
  }

  async getShipmentsByOrigin() {
    const data = await this.shipmentsRepository
      .createQueryBuilder('shipment')
      .select('shipment.origin', 'origin')
      .addSelect('COUNT(*)', 'count')
      .groupBy('shipment.origin')
      .getRawMany();

    return data.map((item) => ({
      origin: item.origin,
      count: parseInt(item.count),
    }));
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date) {
    const invoices = await this.invoicesRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()),
      0,
    );
    const paidAmount = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amountPaid.toString()),
      0,
    );

    return {
      period: { startDate, endDate },
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  }

  async getAverageDeliveryTime() {
    const deliveredShipments = await this.shipmentsRepository.find({
      where: { status: ShipmentStatus.DELIVERED },
      select: ['createdAt', 'actualDeliveryDate'],
    });

    if (deliveredShipments.length === 0) {
      return { averageDays: 0, totalShipments: 0 };
    }

    const totalDays = deliveredShipments.reduce((sum, shipment) => {
      if (shipment.actualDeliveryDate) {
        const diff =
          shipment.actualDeliveryDate.getTime() - shipment.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);

    return {
      averageDays: Math.round(totalDays / deliveredShipments.length),
      totalShipments: deliveredShipments.length,
    };
  }
}
