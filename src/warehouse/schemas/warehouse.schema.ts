import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'warehouses' })
export class Warehouse extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true, index: true })
  country: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: Number, default: 0 })
  capacity: number;

  @Prop({ type: Number, default: 0 })
  currentStock: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

// Indexes
WarehouseSchema.index({ code: 1 });
WarehouseSchema.index({ country: 1 });
WarehouseSchema.index({ isActive: 1 });

// Virtual pour l'inventaire
WarehouseSchema.virtual('inventory', {
  ref: 'WarehouseInventory',
  localField: '_id',
  foreignField: 'warehouseId',
});
