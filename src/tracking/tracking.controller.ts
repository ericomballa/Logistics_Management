import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tracking event' })
  createEvent(@Body() createEventDto: CreateTrackingEventDto) {
    return this.trackingService.createEvent(createEventDto);
  }

  @Get('shipment/:shipmentId')
  @ApiOperation({ summary: 'Get tracking events for shipment' })
  getShipmentTracking(@Param('shipmentId') shipmentId: string) {
    return this.trackingService.findByShipmentWithTimeline(shipmentId);
  }

  @Get('events/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent tracking events' })
  getRecentEvents(@Query('limit') limit?: number) {
    return this.trackingService.getRecentEvents(limit);
  }

  @Get('events/status/:status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events by status' })
  getEventsByStatus(@Param('status') status: string) {
    return this.trackingService.getEventsByStatus(status);
  }
}
