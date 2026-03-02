import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'roles' })
export class Role extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Index pour recherche rapide
RoleSchema.index({ name: 1 });
