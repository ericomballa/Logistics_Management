import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'tariffs' })
export class Tariff extends Document {
  @Prop({ required: true })
  origin: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ required: true, type: Number })
  basePrice: number; // Price for first kg

  @Prop({ required: true, type: Number })
  pricePerKg: number; // Additional price per kg

  @Prop({ type: Number })
  minWeight: number; // Minimum weight for this tariff

  @Prop({ type: Number })
  maxWeight: number; // Maximum weight for this tariff

  @Prop()
  serviceType: string; // Standard, Express, etc.

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const TariffSchema = SchemaFactory.createForClass(Tariff);

// Indexes
TariffSchema.index({ origin: 1, destination: 1 });
TariffSchema.index({ isActive: 1 });

// Getter pour id (compatible avec l'ancien code TypeORM)
TariffSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
TariffSchema.set('toJSON', { virtuals: true });
TariffSchema.set('toObject', { virtuals: true });
