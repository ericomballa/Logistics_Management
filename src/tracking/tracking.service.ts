import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrackingEvent } from './schemas/tracking-event.schema';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(TrackingEvent.name)
    private trackingEventModel: Model<TrackingEvent>,
  ) {}

  async createEvent(
    createEventDto: CreateTrackingEventDto,
  ): Promise<TrackingEvent> {
    const event = new this.trackingEventModel({
      ...createEventDto,
      timestamp: new Date(),
    });

    return event.save();
  }

  async findByShipment(shipmentId: string): Promise<TrackingEvent[]> {
    return this.trackingEventModel
      .find({ shipmentId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async findByShipmentWithTimeline(shipmentId: string) {
    const events = await this.findByShipment(shipmentId);

    return {
      shipmentId,
      totalEvents: events.length,
      currentStatus: events[0]?.status,
      currentLocation: events[0]?.location,
      lastUpdate: events[0]?.timestamp,
      timeline: events.map((event) => ({
        status: event.status,
        location: event.location,
        country: event.country,
        description: event.description,
        timestamp: event.timestamp,
        actor: event.actor,
      })),
    };
  }

  async getRecentEvents(limit: number = 50): Promise<TrackingEvent[]> {
    return this.trackingEventModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getEventsByStatus(status: string): Promise<TrackingEvent[]> {
    return this.trackingEventModel
      .find({ status })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TrackingEvent[]> {
    return this.trackingEventModel
      .find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  async deleteEventsByShipment(shipmentId: string): Promise<void> {
    await this.trackingEventModel.deleteMany({ shipmentId }).exec();
  }
}
