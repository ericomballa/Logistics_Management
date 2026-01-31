// ============================================
// src/warehouse/warehouse.controller.ts
// ============================================
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AddToInventoryDto } from './dto/add-to-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('warehouse')
@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  // ==================== WAREHOUSE ENDPOINTS ====================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Warehouse code already exists' })
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehouseService.createWarehouse(createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  findAll(@Query('country') country?: string, @Query('isActive') isActive?: boolean) {
    return this.warehouseService.findAllWarehouses({ country, isActive });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get warehouse statistics' })
  @ApiResponse({ status: 200, description: 'Warehouse statistics' })
  getStats() {
    return this.warehouseService.getWarehouseStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Warehouse found' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  findOne(@Param('id') id: string) {
    return this.warehouseService.findWarehouse(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get statistics for specific warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Warehouse statistics' })
  getWarehouseStats(@Param('id') id: string) {
    return this.warehouseService.getWarehouseSpecificStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Warehouse updated successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehouseService.updateWarehouse(id, updateWarehouseDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 204, description: 'Warehouse deleted successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete warehouse with inventory',
  })
  remove(@Param('id') id: string) {
    return this.warehouseService.removeWarehouse(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Warehouse deactivated' })
  deactivate(@Param('id') id: string) {
    return this.warehouseService.updateWarehouse(id, { isActive: false });
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Warehouse activated' })
  activate(@Param('id') id: string) {
    return this.warehouseService.updateWarehouse(id, { isActive: true });
  }

  // ==================== INVENTORY ENDPOINTS ====================

  @Post('inventory')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add shipment to warehouse inventory' })
  @ApiResponse({ status: 201, description: 'Shipment added to inventory' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or warehouse not found',
  })
  addToInventory(@Body() addToInventoryDto: AddToInventoryDto, @CurrentUser() user: any) {
    return this.warehouseService.addToInventory(addToInventoryDto, user.userId);
  }

  @Get('inventory/get/all')
  @ApiOperation({ summary: 'Get inventory items with filters' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'shipmentId', required: false })
  @ApiQuery({ name: 'isInWarehouse', required: false, type: Boolean })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  getInventory(@Query() queryDto: QueryInventoryDto) {
    console.log(queryDto);

    return this.warehouseService.getInventory(queryDto);
  }

  @Get('inventory/:id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item found' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  getInventoryItem(@Param('id') id: string) {
    return this.warehouseService.getInventoryItem(id);
  }

  @Patch('inventory/:id/dispatch')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Dispatch shipment from warehouse' })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Shipment dispatched successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 400, description: 'Shipment already dispatched' })
  dispatch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.warehouseService.dispatchFromInventory(id, user.userId);
  }

  @Get(':warehouseId/inventory')
  @ApiOperation({ summary: 'Get all inventory items for a specific warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiQuery({ name: 'isInWarehouse', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  getWarehouseInventory(
    @Param('warehouseId') warehouseId: string,
    @Query('isInWarehouse') isInWarehouse?: boolean,
  ) {
    return this.warehouseService.getInventoryByWarehouse(warehouseId, isInWarehouse);
  }

  @Delete('inventory/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete inventory item (use with caution)' })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({ status: 204, description: 'Inventory item deleted' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  removeInventoryItem(@Param('id') id: string) {
    return this.warehouseService.removeInventoryItem(id);
  }

  // ==================== SCAN/QR CODE ENDPOINTS ====================

  @Get('scan/qr/:qrCode')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Find shipment by QR code' })
  @ApiParam({ name: 'qrCode', description: 'QR code value' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.warehouseService.findByQrCode(qrCode);
  }

  @Get('scan/barcode/:barcode')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Find shipment by barcode' })
  @ApiParam({ name: 'barcode', description: 'Barcode value' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.warehouseService.findByBarcode(barcode);
  }

  // ==================== REPORTING ENDPOINTS ====================

  @Get(':id/occupancy')
  @ApiOperation({ summary: 'Get warehouse occupancy rate' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({ status: 200, description: 'Occupancy information' })
  getOccupancy(@Param('id') id: string) {
    return this.warehouseService.getWarehouseOccupancy(id);
  }

  @Get(':id/recent-activity')
  @ApiOperation({ summary: 'Get recent warehouse activity' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records',
  })
  @ApiResponse({ status: 200, description: 'Recent activity' })
  getRecentActivity(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.warehouseService.getRecentActivity(id, limit || 10);
  }
}
