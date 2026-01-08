import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipment' })
  create(
    @Body() createShipmentDto: CreateShipmentDto,
    @CurrentUser() user: any,
  ) {
    return this.shipmentsService.create(createShipmentDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  findAll(@Query() filters: any) {
    return this.shipmentsService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get shipments statistics' })
  getStats() {
    return this.shipmentsService.getStats();
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number' })
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.findByTrackingNumber(trackingNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipment' })
  update(
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
    @CurrentUser() user: any,
  ) {
    return this.shipmentsService.update(id, updateShipmentDto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipment' })
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
