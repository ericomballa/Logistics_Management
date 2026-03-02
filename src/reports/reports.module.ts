import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Shipment, ShipmentSchema } from '../shipments/schemas/shipment.schema';
import { Invoice, InvoiceSchema } from '../billing/schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shipment.name, schema: ShipmentSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
