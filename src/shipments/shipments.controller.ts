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
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../users/enums/user-role.enum';
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
  constructor(private readonly shipmentsService: ShipmentsService) {
    console.log('ShipmentsController initialized');
    console.log('CreateShipmentDto:', CreateShipmentDto);
    console.log('JwtAuthGuard:', JwtAuthGuard);
  }

  @Post()
  @ApiOperation({ summary: 'Create shipment' })
  create(@Body() createShipmentDto: CreateShipmentDto, @CurrentUser() user: any) {
    return this.shipmentsService.create(createShipmentDto, user.userId, user.name || user.email);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  findAll(@Query() filters: any, @CurrentUser() user: any) {
    // If user is an AGENT, they only see shipments they created or that are assigned to them
    if (user.role === UserRole.AGENT) {
      filters.agentOrCreatorId = user.userId;
    }
    return this.shipmentsService.findAll(filters);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign shipment to agent' })
  assign(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.shipmentsService.assignAgent(id, agentId);
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
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.SECRETARY) {
      throw new ForbiddenException('Secretaries cannot delete shipments');
    }
    return this.shipmentsService.remove(id);
  }
}
