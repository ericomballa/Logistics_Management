import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'payments' })
export class Payment extends Document {
  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true })
  method: string; // CASH, BANK_TRANSFER, MOBILE_MONEY, etc.

  @Prop({ type: String, default: 'PENDING' })
  status: string; // PENDING, COMPLETED, FAILED, REFUNDED

  @Prop()
  transactionId: string; // Reference from payment processor

  @Prop()
  notes: string;

  @Prop()
  currency: string; // Default to XAF

  @Prop()
  reference: string; // Payment reference

  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true, index: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedById: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

// Virtual pour les relations
PaymentSchema.virtual('invoice', {
  ref: 'Invoice',
  localField: 'invoiceId',
  foreignField: '_id',
  justOne: true,
});

PaymentSchema.virtual('processedBy', {
  ref: 'User',
  localField: 'processedById',
  foreignField: '_id',
  justOne: true,
});

// Getter pour id (compatible avec l'ancien code TypeORM)
PaymentSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });
