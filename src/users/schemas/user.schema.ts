import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { Agency } from './agency.schema';
import { Role } from './role.schema';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CLIENT, index: true })
  role: UserRole;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Agency', index: true })
  agencyId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles: Types.ObjectId[];

  @Prop()
  lastLoginAt: Date;

  @Prop()
  lastLoginIp: string;

  @Prop()
  notes: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  // Virtual pour le comptage des shipments
  shipmentCount?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Virtual pour le relation agency
UserSchema.virtual('agency', {
  ref: 'Agency',
  localField: 'agencyId',
  foreignField: '_id',
  justOne: true,
});

// Virtual pour la relation roles
UserSchema.virtual('rolesData', {
  ref: 'Role',
  localField: 'roles',
  foreignField: '_id',
});

// Getter pour id (compatible avec l'ancien code TypeORM)
UserSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Inclure les virtuals dans la sérialisation JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
