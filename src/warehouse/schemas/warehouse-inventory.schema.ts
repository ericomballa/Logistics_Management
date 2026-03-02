import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'warehouse_inventory' })
export class WarehouseInventory extends Document {
  @Prop({ required: true, index: true })
  shipmentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true, index: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true })
  location: string; // Shelf/Zone location

  @Prop()
  qrCode: string;

  @Prop()
  barcode: string;

  @Prop()
  receivedAt: Date;

  @Prop()
  dispatchedAt: Date;

  @Prop({ default: true, index: true })
  isInWarehouse: boolean;
}

export const WarehouseInventorySchema = SchemaFactory.createForClass(WarehouseInventory);

// Indexes
WarehouseInventorySchema.index({ shipmentId: 1 });
WarehouseInventorySchema.index({ warehouseId: 1 });
WarehouseInventorySchema.index({ isInWarehouse: 1 });

// Virtual pour la relation shipment
WarehouseInventorySchema.virtual('shipment', {
  ref: 'Shipment',
  localField: 'shipmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual pour la relation warehouse
WarehouseInventorySchema.virtual('warehouse', {
  ref: 'Warehouse',
  localField: 'warehouseId',
  foreignField: '_id',
  justOne: true,
});

// Getter pour id (compatible avec l'ancien code TypeORM)
WarehouseInventorySchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
WarehouseInventorySchema.set('toJSON', { virtuals: true });
WarehouseInventorySchema.set('toObject', { virtuals: true });
