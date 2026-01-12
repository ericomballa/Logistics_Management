// ============================================
// src/warehouse/warehouse.service.ts
// ============================================
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { WarehouseInventory } from './entities/warehouse-inventory.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AddToInventoryDto } from './dto/add-to-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseInventory)
    private inventoryRepository: Repository<WarehouseInventory>,
  ) {}

  // ==================== WAREHOUSE METHODS ====================

  async createWarehouse(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    // Check if code already exists
    const existingWarehouse = await this.warehouseRepository.findOne({
      where: { code: createWarehouseDto.code },
    });

    if (existingWarehouse) {
      throw new BadRequestException(
        `Warehouse with code ${createWarehouseDto.code} already exists`,
      );
    }

    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async findAllWarehouses(filters?: {
    country?: string;
    isActive?: boolean;
  }): Promise<Warehouse[]> {
    const query = this.warehouseRepository
      .createQueryBuilder('warehouse')
      .leftJoinAndSelect(
        'warehouse.inventory',
        'inventory',
        'inventory.isInWarehouse = :inWarehouse',
        { inWarehouse: true },
      )
      .loadRelationCountAndMap(
        'warehouse.currentInventoryCount',
        'warehouse.inventory',
        'inventoryCount',
        (qb) =>
          qb.where('inventoryCount.isInWarehouse = :inWarehouse', {
            inWarehouse: true,
          }),
      );

    if (filters?.country) {
      query.andWhere('warehouse.country = :country', {
        country: filters.country,
      });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('warehouse.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return query.orderBy('warehouse.name', 'ASC').getMany();
  }

  async findWarehouse(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['inventory'],
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async findWarehouseByCode(code: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({
      where: { code },
    });
  }

  async updateWarehouse(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findWarehouse(id);

    // Check code uniqueness if changed
    if (updateWarehouseDto.code && updateWarehouseDto.code !== warehouse.code) {
      const existingWarehouse = await this.warehouseRepository.findOne({
        where: { code: updateWarehouseDto.code },
      });

      if (existingWarehouse) {
        throw new BadRequestException(
          `Warehouse with code ${updateWarehouseDto.code} already exists`,
        );
      }
    }

    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async removeWarehouse(id: string): Promise<void> {
    const warehouse = await this.findWarehouse(id);

    // Check if warehouse has inventory
    const inventoryCount = await this.inventoryRepository.count({
      where: { warehouseId: id, isInWarehouse: true },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete warehouse with ${inventoryCount} active inventory items. Please dispatch or move items first.`,
      );
    }

    await this.warehouseRepository.remove(warehouse);
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

    // Check if shipment already in inventory
    const existingInventory = await this.inventoryRepository.findOne({
      where: {
        shipmentId: addToInventoryDto.shipmentId,
        isInWarehouse: true,
      },
    });

    if (existingInventory) {
      throw new BadRequestException('Shipment is already in warehouse inventory');
    }

    // Check capacity
    if (warehouse.capacity && warehouse.currentStock >= warehouse.capacity) {
      throw new BadRequestException('Warehouse is at full capacity');
    }

    const inventory = this.inventoryRepository.create({
      ...addToInventoryDto,
      receivedAt: new Date(),
      isInWarehouse: true,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Update warehouse current stock
    warehouse.currentStock = (warehouse.currentStock || 0) + 1;
    await this.warehouseRepository.save(warehouse);

    return savedInventory;
  }

  async dispatchFromInventory(inventoryId: string, userId: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId },
      relations: ['warehouse'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${inventoryId} not found`);
    }

    if (!inventory.isInWarehouse) {
      throw new BadRequestException('Shipment has already been dispatched');
    }

    inventory.isInWarehouse = false;
    inventory.dispatchedAt = new Date();

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Update warehouse current stock
    const warehouse = inventory.warehouse;
    warehouse.currentStock = Math.max((warehouse.currentStock || 0) - 1, 0);
    await this.warehouseRepository.save(warehouse);

    return savedInventory;
  }

  async getInventory(queryDto: QueryInventoryDto): Promise<WarehouseInventory[]> {
    try {
      const query = this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.warehouse', 'warehouse');

      if (queryDto.warehouseId) {
        query.andWhere('inventory.warehouseId = :warehouseId', {
          warehouseId: queryDto.warehouseId,
        });
      }

      if (queryDto.shipmentId) {
        query.andWhere('inventory.shipmentId = :shipmentId', {
          shipmentId: queryDto.shipmentId,
        });
      }

      if (queryDto.isInWarehouse !== undefined) {
        query.andWhere('inventory.isInWarehouse = :isInWarehouse', {
          isInWarehouse: queryDto.isInWarehouse,
        });
      }

      if (queryDto.location) {
        query.andWhere('inventory.location IS NOT NULL AND inventory.location ILIKE :location', {
          location: `%${queryDto.location}%`,
        });
      }

      if (queryDto.receivedFrom) {
        query.andWhere(
          'inventory.receivedAt IS NOT NULL AND inventory.receivedAt >= :receivedFrom',
          {
            receivedFrom: queryDto.receivedFrom,
          },
        );
      }

      if (queryDto.receivedTo) {
        query.andWhere('inventory.receivedAt IS NOT NULL AND inventory.receivedAt <= :receivedTo', {
          receivedTo: queryDto.receivedTo,
        });
      }

      return await query.orderBy('inventory.receivedAt', 'DESC').getMany();
    } catch (error) {
      console.error('❌ INVENTORY QUERY FAILED', error);
      throw new InternalServerErrorException('Erreur lors de la récupération de l’inventaire');
    }
  }

  async getInventoryItem(id: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventory;
  }

  async getInventoryByWarehouse(
    warehouseId: string,
    isInWarehouse?: boolean,
  ): Promise<WarehouseInventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.warehouseId = :warehouseId', { warehouseId });

    if (isInWarehouse !== undefined) {
      query.andWhere('inventory.isInWarehouse = :isInWarehouse', {
        isInWarehouse,
      });
    }

    return query.orderBy('inventory.receivedAt', 'DESC').getMany();
  }

  async removeInventoryItem(id: string): Promise<void> {
    const inventory = await this.getInventoryItem(id);
    await this.inventoryRepository.remove(inventory);
  }

  // ==================== SCAN METHODS ====================

  async findByQrCode(qrCode: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { qrCode },
      relations: ['warehouse'],
    });

    if (!inventory) {
      throw new NotFoundException(`No shipment found with QR code: ${qrCode}`);
    }

    return inventory;
  }

  async findByBarcode(barcode: string): Promise<WarehouseInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { barcode },
      relations: ['warehouse'],
    });

    if (!inventory) {
      throw new NotFoundException(`No shipment found with barcode: ${barcode}`);
    }

    return inventory;
  }

  // ==================== STATISTICS & REPORTING ====================

  async getWarehouseStats() {
    const totalWarehouses = await this.warehouseRepository.count();
    const activeWarehouses = await this.warehouseRepository.count({
      where: { isActive: true },
    });

    const totalCapacity = await this.warehouseRepository
      .createQueryBuilder('warehouse')
      .select('SUM(warehouse.capacity)', 'total')
      .getRawOne();

    const totalStock = await this.warehouseRepository
      .createQueryBuilder('warehouse')
      .select('SUM(warehouse.currentStock)', 'total')
      .getRawOne();

    const totalInventoryItems = await this.inventoryRepository.count({
      where: { isInWarehouse: true },
    });

    return {
      totalWarehouses,
      activeWarehouses,
      inactiveWarehouses: totalWarehouses - activeWarehouses,
      totalCapacity: parseInt(totalCapacity?.total || '0'),
      totalStock: parseInt(totalStock?.total || '0'),
      totalInventoryItems,
      occupancyRate:
        totalCapacity?.total > 0
          ? ((totalStock?.total / totalCapacity?.total) * 100).toFixed(2)
          : 0,
    };
  }

  async getWarehouseSpecificStats(id: string) {
    const warehouse = await this.findWarehouse(id);

    const inventoryCount = await this.inventoryRepository.count({
      where: { warehouseId: id, isInWarehouse: true },
    });

    const dispatchedCount = await this.inventoryRepository.count({
      where: { warehouseId: id, isInWarehouse: false },
    });

    const occupancyRate =
      warehouse.capacity > 0 ? ((warehouse.currentStock / warehouse.capacity) * 100).toFixed(2) : 0;

    return {
      warehouseId: warehouse.id,
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
      warehouseId: warehouse.id,
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

    const recentReceived = await this.inventoryRepository.find({
      where: { warehouseId },
      order: { receivedAt: 'DESC' },
      take: limit,
    });

    const recentDispatched = await this.inventoryRepository.find({
      where: { warehouseId, isInWarehouse: false },
      order: { dispatchedAt: 'DESC' },
      take: limit,
    });

    return {
      warehouseId: warehouse.id,
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
