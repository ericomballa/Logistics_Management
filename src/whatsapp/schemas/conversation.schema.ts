import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WhatsappUser', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  context: Record<string, any>;

  @Prop({ type: String, default: 'active' })
  status: string;

  @Prop()
  currentStep: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ status: 1 });

// Virtual pour les messages
ConversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
  options: { sort: { createdAt: -1 } },
});

// Virtual pour la relation user
ConversationSchema.virtual('user', {
  ref: 'WhatsappUser',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Getter pour id (compatible avec l'ancien code TypeORM)
ConversationSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
ConversationSchema.set('toJSON', { virtuals: true });
ConversationSchema.set('toObject', { virtuals: true });
