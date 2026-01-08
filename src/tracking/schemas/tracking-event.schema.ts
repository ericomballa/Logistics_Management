import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'tracking_events' })
export class TrackingEvent extends Document {
  @Prop({ required: true, index: true })
  shipmentId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ required: true, enum: ['SYSTEM', 'AGENT', 'CLIENT'] })
  actor: string;

  @Prop()
  actorId: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const TrackingEventSchema = SchemaFactory.createForClass(TrackingEvent);

// Indexes for performance
TrackingEventSchema.index({ shipmentId: 1, timestamp: -1 });
TrackingEventSchema.index({ status: 1 });
TrackingEventSchema.index({ timestamp: -1 });
