import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuditActionType } from '../enums/audit-action-type.enum';

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog extends Document {
  @Prop({ required: true, index: true })
  action: AuditActionType;

  @Prop({ required: true, index: true })
  entityType: string;

  @Prop()
  entityId: string;

  @Prop({ required: true })
  performedBy: string; // User's name or email

  @Prop()
  userId: string; // User ID if available

  @Prop()
  ipAddress: string;

  @Prop()
  details: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Composite index for common queries
AuditLogSchema.index({ action: 1, entityType: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });
