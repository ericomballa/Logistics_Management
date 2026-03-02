import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Warehouse } from './schemas/warehouse.schema';
import { WarehouseInventory } from './schemas/warehouse-inventory.schema';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AddToInventoryDto } from './dto/add-to-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(Warehouse.name)
    private warehouseModel: Model<Warehouse>,
    @InjectModel(WarehouseInventory.name)
    private inventoryModel: Model<WarehouseInventory>,
  ) { }

  // ==================== WAREHOUSE METHODS ====================

  async createWarehouse(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    console.log(createWarehouseDto);

    const existingWarehouse = await this.warehouseModel.findOne({ code: createWarehouseDto.code }).exec();

    if (existingWarehouse) {
      throw new BadRequestException(
        `Warehouse with code ${createWarehouseDto.code} already exists`,
      );
    }

    const warehouse = await this.warehouseModel.create(createWarehouseDto);
    return warehouse.save();
  }

  async findAllWarehouses(filters?: {
    country?: string;
    isActive?: boolean;
  }): Promise<Warehouse[]> {
    const query: any = {};

    if (filters?.country) {
      query.country = filters.country;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return this.warehouseModel.find(query).sort({ name: 1 }).exec();
  }

  async findWarehouse(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseModel.findById(id).exec();

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async findWarehouseByCode(code: string): Promise<Warehouse | null> {
    return this.warehouseModel.findOne({ code }).exec();
  }

  async updateWarehouse(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findWarehouse(id);

    if (updateWarehouseDto.code && updateWarehouseDto.code !== warehouse.code) {
      const existingWarehouse = await this.warehouseModel.findOne({
        code: updateWarehouseDto.code,
        _id: { $ne: new Types.ObjectId(id) },
      }).exec();

      if (existingWarehouse) {
        throw new BadRequestException(
          `Warehouse with code ${updateWarehouseDto.code} already exists`,
        );
      }
    }

    const updatedWarehouse = await this.warehouseModel
      .findByIdAndUpdate(
        id,
        { $set: updateWarehouseDto },
        { new: true, runValidators: true },
      )
      .exec();

    return updatedWarehouse;
  }

  async removeWarehouse(id: string): Promise<void> {
    const warehouse = await this.findWarehouse(id);

    const inventoryCount = await this.inventoryModel.countDocuments({
      warehouseId: new Types.ObjectId(id),
      isInWarehouse: true,
    }).exec();

    if (inventoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete warehouse with ${inventoryCount} active inventory items. Please dispatch or move items first.`,
      );
    }

    await this.warehouseModel.findByIdAndDelete(id).exec();
  }

  // ==================== INVENTORY METHODS ====================

  async addToInventory(
    addToInventoryDto: AddToInventoryDto,
    userId: string,
  ): Promise<WarehouseInventory> {
    const warehouse = await this.findWarehouse(addToInventoryDto.warehouseId);

    if (!warehouse.isActive) {
      throw new BadRequestException('Cannot add to inactive warehouse');
    }

    const existingInventory = await this.inventoryModel.findOne({
      shipmentId: addToInventoryDto.shipmentId,
      isInWarehouse: true,
    }).exec();

    if (existingInventory) {
      throw new BadRequestException('Shipment is already in warehouse inventory');
    }

    if (warehouse.capacity && warehouse.currentStock >= warehouse.capacity) {
      throw new BadRequestException('Warehouse is at full capacity');
    }

    const inventory = await this.inventoryModel.create({
      ...addToInventoryDto,
      receivedAt: new Date(),
      isInWarehouse: true,
    });

    const savedInventory = await inventory.save();

    warehouse.currentStock = (warehouse.currentStock || 0) + 1;
    await this.warehouseModel.findByIdAndUpdate(warehouse._id, {
      $set: { currentStock: warehouse.currentStock },
    }).exec();

    return savedInventory;
  }

  async dispatchFromInventory(inventoryId: string, userId: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryModel.findById(inventoryId).exec();

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${inventoryId} not found`);
    }

    if (!inventory.isInWarehouse) {
      throw new BadRequestException('Shipment has already been dispatched');
    }

    inventory.isInWarehouse = false;
    inventory.dispatchedAt = new Date();

    const savedInventory = await inventory.save();

    const warehouse = await this.warehouseModel.findById(inventory.warehouseId).exec();
    warehouse.currentStock = Math.max((warehouse.currentStock || 0) - 1, 0);
    await this.warehouseModel.findByIdAndUpdate(warehouse._id, {
      $set: { currentStock: warehouse.currentStock },
    }).exec();

    return savedInventory;
  }

  async getInventory(queryDto: QueryInventoryDto): Promise<WarehouseInventory[]> {
    try {
      const query: any = {};

      if (queryDto.warehouseId) {
        query.warehouseId = new Types.ObjectId(queryDto.warehouseId);
      }

      if (queryDto.shipmentId) {
        query.shipmentId = queryDto.shipmentId;
      }

      if (queryDto.isInWarehouse !== undefined) {
        query.isInWarehouse = queryDto.isInWarehouse;
      }

      if (queryDto.location) {
        query.location = new RegExp(queryDto.location, 'i');
      }

      if (queryDto.receivedFrom) {
        query.receivedAt = { $gte: queryDto.receivedFrom };
      }

      if (queryDto.receivedTo) {
        query.receivedAt = { ...query.receivedAt, $lte: queryDto.receivedTo };
      }

      return this.inventoryModel
        .find(query)
        .populate('warehouseId')
        .sort({ receivedAt: -1 })
        .exec();
    } catch (error) {
      console.error('❌ INVENTORY QUERY FAILED', error);
      throw new InternalServerErrorException('Erreur lors de la recuperation de l\'inventaire');
    }
  }

  async getInventoryItem(id: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryModel
      .findById(id)
      .populate('warehouseId')
      .exec();

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventory;
  }

  async getInventoryByWarehouse(
    warehouseId: string,
    isInWarehouse?: boolean,
  ): Promise<WarehouseInventory[]> {
    const query: any = { warehouseId: new Types.ObjectId(warehouseId) };

    if (isInWarehouse !== undefined) {
      query.isInWarehouse = isInWarehouse;
    }

    return this.inventoryModel.find(query).sort({ receivedAt: -1 }).exec();
  }

  async removeInventoryItem(id: string): Promise<void> {
    await this.inventoryModel.findByIdAndDelete(id).exec();
  }

  // ==================== SCAN METHODS ====================

  async findByQrCode(qrCode: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryModel
      .findOne({ qrCode })
      .populate('warehouseId')
      .exec();

    if (!inventory) {
      throw new NotFoundException(`No shipment found with QR code: ${qrCode}`);
    }

    return inventory;
  }

  async findByBarcode(barcode: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryModel
      .findOne({ barcode })
      .populate('warehouseId')
      .exec();

    if (!inventory) {
      throw new NotFoundException(`No shipment found with barcode: ${barcode}`);
    }

    return inventory;
  }

  // ==================== STATISTICS & REPORTING ====================

  async getWarehouseStats() {
    const totalWarehouses = await this.warehouseModel.countDocuments().exec();
    const activeWarehouses = await this.warehouseModel.countDocuments({ isActive: true }).exec();

    const warehouses = await this.warehouseModel.find().exec();
    const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);
    const totalStock = warehouses.reduce((sum, w) => sum + (w.currentStock || 0), 0);

    const totalInventoryItems = await this.inventoryModel.countDocuments({ isInWarehouse: true }).exec();

    return {
      totalWarehouses,
      activeWarehouses,
      inactiveWarehouses: totalWarehouses - activeWarehouses,
      totalCapacity,
      totalStock,
      totalInventoryItems,
      occupancyRate:
        totalCapacity > 0
          ? ((totalStock / totalCapacity) * 100).toFixed(2)
          : 0,
    };
  }

  async getWarehouseSpecificStats(id: string) {
    const warehouse = await this.findWarehouse(id);

    const inventoryCount = await this.inventoryModel.countDocuments({
      warehouseId: new Types.ObjectId(id),
      isInWarehouse: true,
    }).exec();

    const dispatchedCount = await this.inventoryModel.countDocuments({
      warehouseId: new Types.ObjectId(id),
      isInWarehouse: false,
    }).exec();

    const occupancyRate =
      warehouse.capacity > 0 ? ((warehouse.currentStock / warehouse.capacity) * 100).toFixed(2) : 0;

    return {
      warehouseId: warehouse._id.toString(),
      name: warehouse.name,
      code: warehouse.code,
      capacity: warehouse.capacity,
      currentStock: warehouse.currentStock,
      inventoryCount,
      dispatchedCount,
      occupancyRate: `${occupancyRate}%`,
      isActive: warehouse.isActive,
    };
  }

  async getWarehouseOccupancy(id: string) {
    const warehouse = await this.findWarehouse(id);

    return {
      warehouseId: warehouse._id.toString(),
      name: warehouse.name,
      capacity: warehouse.capacity,
      currentStock: warehouse.currentStock,
      available: warehouse.capacity - warehouse.currentStock,
      occupancyRate:
        warehouse.capacity > 0
          ? `${((warehouse.currentStock / warehouse.capacity) * 100).toFixed(2)}%`
          : 'N/A',
      status:
        warehouse.currentStock >= warehouse.capacity * 0.9
          ? 'FULL'
          : warehouse.currentStock >= warehouse.capacity * 0.7
            ? 'HIGH'
            : warehouse.currentStock >= warehouse.capacity * 0.5
              ? 'MEDIUM'
              : 'LOW',
    };
  }

  async getRecentActivity(warehouseId: string, limit: number = 10) {
    const warehouse = await this.findWarehouse(warehouseId);

    const recentReceived = await this.inventoryModel
      .find({ warehouseId: new Types.ObjectId(warehouseId) })
      .sort({ receivedAt: -1 })
      .limit(limit)
      .exec();

    const recentDispatched = await this.inventoryModel
      .find({ warehouseId: new Types.ObjectId(warehouseId), isInWarehouse: false })
      .sort({ dispatchedAt: -1 })
      .limit(limit)
      .exec();

    return {
      warehouseId: warehouse._id.toString(),
      name: warehouse.name,
      recentReceived: recentReceived.map((item) => ({
        shipmentId: item.shipmentId,
        location: item.location,
        receivedAt: item.receivedAt,
      })),
      recentDispatched: recentDispatched.map((item) => ({
        shipmentId: item.shipmentId,
        location: item.location,
        dispatchedAt: item.dispatchedAt,
      })),
    };
  }
}
