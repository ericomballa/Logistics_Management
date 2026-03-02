import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { Shipment, ShipmentSchema } from './schemas/shipment.schema';
import { TrackingModule } from '../tracking/tracking.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Shipment.name, schema: ShipmentSchema }]),
    TrackingModule,
    AuditModule,
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
