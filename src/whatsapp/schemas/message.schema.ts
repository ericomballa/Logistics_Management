import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, default: 'user' })
  sender: string;

  @Prop()
  whatsappMessageId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Virtual pour la relation conversation
MessageSchema.virtual('conversation', {
  ref: 'Conversation',
  localField: 'conversationId',
  foreignField: '_id',
  justOne: true,
});

// Getter pour id (compatible avec l'ancien code TypeORM)
MessageSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });
