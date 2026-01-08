import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Invoice } from '../billing/entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Invoice])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
