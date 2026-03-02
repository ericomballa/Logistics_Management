import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShipmentStatus } from '../enums/shipment-status.enum';
import { OriginCountry } from '../enums/origin-country.enum';
import { DestinationCountry } from '../enums/destination-country.enum';

@Schema({ timestamps: true, collection: 'shipments' })
export class Shipment extends Document {
  @Prop({ required: true, unique: true, index: true })
  trackingNumber: string;

  // Sender
  @Prop({ required: true })
  senderName: string;

  @Prop()
  senderPhone: string;

  @Prop()
  senderEmail: string;

  @Prop()
  senderAddress: string;

  // Receiver
  @Prop({ required: true })
  receiverName: string;

  @Prop({ required: true })
  receiverPhone: string;

  @Prop()
  receiverEmail: string;

  @Prop({ required: true })
  receiverAddress: string;

  @Prop()
  receiverCity: string;

  @Prop()
  originCity: string;

  @Prop()
  destinationCity: string;

  // Origin & Destination
  @Prop({ type: String, enum: OriginCountry, required: true, index: true })
  origin: OriginCountry;

  @Prop({ type: String, enum: DestinationCountry, required: true, index: true })
  destination: DestinationCountry;

  // Shipment details
  @Prop({ required: true, type: Number })
  weight: number;

  @Prop({ type: Number })
  volume: number;

  @Prop({ type: Number })
  declaredValue: number;

  @Prop()
  dimensions: string;

  @Prop()
  serviceType: string;

  @Prop()
  description: string;

  @Prop({ type: Number, default: 1 })
  numberOfPackages: number;

  // Status & Tracking
  @Prop({ type: String, enum: ShipmentStatus, default: ShipmentStatus.PENDING, index: true })
  status: ShipmentStatus;

  @Prop()
  currentLocation: string;

  @Prop()
  warehouseId: string;

  // Client & Agent
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdById: Types.ObjectId;

  // Dates
  @Prop()
  estimatedDeliveryDate: Date;

  @Prop()
  actualDeliveryDate: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

// Indexes for performance
ShipmentSchema.index({ trackingNumber: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ origin: 1, destination: 1 });
ShipmentSchema.index({ clientId: 1 });
ShipmentSchema.index({ createdAt: -1 });

// Virtuals pour les relations
ShipmentSchema.virtual('client', {
  ref: 'User',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true,
});

ShipmentSchema.virtual('agent', {
  ref: 'User',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true,
});

ShipmentSchema.virtual('createdBy', {
  ref: 'User',
  localField: 'createdById',
  foreignField: '_id',
  justOne: true,
});

// Getter pour id (compatible avec l'ancien code TypeORM)
ShipmentSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
ShipmentSchema.set('toJSON', { virtuals: true });
ShipmentSchema.set('toObject', { virtuals: true });
