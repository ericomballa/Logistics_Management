import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'whatsapp_users' })
export class WhatsappUser extends Document {
  @Prop({ required: true, unique: true, index: true })
  phoneNumber: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop({ type: String, default: 'active' })
  status: string;
}

export const WhatsappUserSchema = SchemaFactory.createForClass(WhatsappUser);

// Indexes
WhatsappUserSchema.index({ phoneNumber: 1 });
WhatsappUserSchema.index({ status: 1 });

// Virtual pour les conversations
WhatsappUserSchema.virtual('conversations', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'userId',
});
