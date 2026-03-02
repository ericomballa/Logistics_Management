import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from '../enums/payment-status.enum';

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice extends Document {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Shipment', index: true })
  shipmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ type: Number, default: 0 })
  amountPaid: number;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING, index: true })
  status: PaymentStatus;

  @Prop()
  dueDate: Date;

  @Prop()
  paidAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdById: Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ createdAt: -1 });

// Virtuals pour les relations
InvoiceSchema.virtual('shipment', {
  ref: 'Shipment',
  localField: 'shipmentId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('client', {
  ref: 'User',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('createdBy', {
  ref: 'User',
  localField: 'createdById',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'invoiceId',
});

// Getter pour id (compatible avec l'ancien code TypeORM)
InvoiceSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
InvoiceSchema.set('toJSON', { virtuals: true });
InvoiceSchema.set('toObject', { virtuals: true });
