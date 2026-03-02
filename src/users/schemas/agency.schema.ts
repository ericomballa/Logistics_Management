import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'agencies' })
export class Agency extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  // Virtual pour le comptage
  userCount?: number;
  shipmentCount?: number;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

// Indexes
AgencySchema.index({ code: 1 });
AgencySchema.index({ isActive: 1 });
