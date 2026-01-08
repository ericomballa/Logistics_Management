import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { TrackingService } from '../tracking/tracking.service';
import { ShipmentStatus } from './enums/shipment-status.enum';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    private trackingService: TrackingService,
  ) {}

  async create(
    createShipmentDto: CreateShipmentDto,
    userId: string,
  ): Promise<Shipment> {
    const trackingNumber = this.generateTrackingNumber(
      createShipmentDto.origin,
    );

    const shipment = this.shipmentsRepository.create({
      ...createShipmentDto,
      trackingNumber,
      clientId: userId,
      status: ShipmentStatus.PENDING,
    });

    const savedShipment = await this.shipmentsRepository.save(shipment);

    // Create initial tracking event
    await this.trackingService.createEvent({
      shipmentId: savedShipment.id,
      status: ShipmentStatus.PENDING,
      location: createShipmentDto.origin,
      country: createShipmentDto.origin,
      description: 'Shipment created',
      actor: 'SYSTEM',
    });

    return savedShipment;
  }

  async findAll(filters?: any): Promise<Shipment[]> {
    const query = this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.client', 'client')
      .leftJoinAndSelect('shipment.agent', 'agent');

    if (filters?.status) {
      query.andWhere('shipment.status = :status', { status: filters.status });
    }

    if (filters?.origin) {
      query.andWhere('shipment.origin = :origin', { origin: filters.origin });
    }

    if (filters?.destination) {
      query.andWhere('shipment.destination = :destination', {
        destination: filters.destination,
      });
    }

    if (filters?.clientId) {
      query.andWhere('shipment.clientId = :clientId', {
        clientId: filters.clientId,
      });
    }

    return query.orderBy('shipment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: ['client', 'agent'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { trackingNumber },
      relations: ['client', 'agent'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async update(
    id: string,
    updateShipmentDto: UpdateShipmentDto,
    userId?: string,
  ): Promise<Shipment> {
    const shipment = await this.findOne(id);

    // Track status changes
    if (
      updateShipmentDto.status &&
      updateShipmentDto.status !== shipment.status
    ) {
      await this.trackingService.createEvent({
        shipmentId: id,
        status: updateShipmentDto.status,
        location: updateShipmentDto.currentLocation || shipment.currentLocation,
        country: shipment.destination,
        description: `Status updated to ${updateShipmentDto.status}`,
        actor: userId ? 'AGENT' : 'SYSTEM',
        actorId: userId,
      });
    }

    Object.assign(shipment, updateShipmentDto);
    return this.shipmentsRepository.save(shipment);
  }

  async remove(id: string): Promise<void> {
    const shipment = await this.findOne(id);
    await this.shipmentsRepository.remove(shipment);
  }

  async getStats() {
    const total = await this.shipmentsRepository.count();
    const pending = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.PENDING },
    });
    const inTransit = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.IN_TRANSIT },
    });
    const delivered = await this.shipmentsRepository.count({
      where: { status: ShipmentStatus.DELIVERED },
    });

    return { total, pending, inTransit, delivered };
  }

  private generateTrackingNumber(origin: string): string {
    const prefix = origin.substring(0, 2).toUpperCase();
    const random = nanoid(8).toUpperCase();
    return `${prefix}-${random}`;
  }
}
