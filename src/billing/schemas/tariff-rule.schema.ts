import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'tariff_rules' })
export class TariffRule extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  origin: string;

  @Prop({ required: true, index: true })
  destination: string;

  @Prop({ required: true, type: Number })
  baseRate: number;

  @Prop({ required: true, type: Number })
  ratePerKg: number;

  @Prop({ type: Number })
  ratePerCbm: number;

  @Prop({ type: Number, default: 0 })
  insuranceRate: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const TariffRuleSchema = SchemaFactory.createForClass(TariffRule);

// Indexes
TariffRuleSchema.index({ origin: 1, destination: 1 });
TariffRuleSchema.index({ isActive: 1 });
