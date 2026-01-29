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
  ) { }

  async create(createShipmentDto: CreateShipmentDto, userId: string): Promise<Shipment> {
    // Default Origin/Destination if missing
    console.log(createShipmentDto);

    const origin = createShipmentDto.origin || 'DUBAI'; // Default to China or configure default
    const destination = createShipmentDto.destination || 'CAMEROON'; // Default to Cameroon

    const trackingNumber = this.generateTrackingNumber(origin);

    // Map payload fields to entity fields
    const receiverName = createShipmentDto.receiverName || createShipmentDto.recipientName;
    const receiverAddress = createShipmentDto.receiverAddress || createShipmentDto.recipientAddress;
    const receiverPhone = createShipmentDto.receiverPhone || '000000000'; // Default placeholder

    // Handle date
    let estimatedDate = createShipmentDto.estimatedDeliveryDate;
    if (typeof estimatedDate === 'string') {
      estimatedDate = new Date(estimatedDate);
    }

    const shipment = this.shipmentsRepository.create({
      ...createShipmentDto,
      origin: origin as any,
      destination: destination as any,
      receiverName,
      receiverAddress,
      receiverPhone,
      receiverCity: createShipmentDto.destinationCity || createShipmentDto.receiverCity,
      originCity: createShipmentDto.originCity,
      destinationCity: createShipmentDto.destinationCity || createShipmentDto.receiverCity,
      estimatedDeliveryDate: estimatedDate as Date,
      trackingNumber,
      clientId: createShipmentDto.clientId || userId,
      createdById: userId,
      status: ShipmentStatus.PENDING,
      description: createShipmentDto.description || `${createShipmentDto.serviceType || 'Standard'} Shipment (${createShipmentDto.dimensions || 'N/A'})`
    });

    const savedShipment = await this.shipmentsRepository.save(shipment);

    // Create initial tracking event
    await this.trackingService.createEvent({
      shipmentId: savedShipment.id,
      status: ShipmentStatus.PENDING,
      location: origin as string,
      country: origin as string,
      description: 'Shipment created',
      actor: 'SYSTEM',
    });

    return savedShipment;
  }

  async findAll(filters?: any): Promise<Shipment[]> {
    const query = this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.client', 'client')
      .leftJoinAndSelect('shipment.agent', 'agent')
      .leftJoinAndSelect('shipment.createdBy', 'createdBy');

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

    if (filters?.agentId) {
      query.andWhere('shipment.agentId = :agentId', {
        agentId: filters.agentId,
      });
    }

    if (filters?.createdById) {
      query.andWhere('shipment.createdById = :createdById', {
        createdById: filters.createdById,
      });
    }

    if (filters?.agentOrCreatorId) {
      query.andWhere(
        '(shipment.agentId = :id OR shipment.createdById = :id)',
        { id: filters.agentOrCreatorId },
      );
    }

    return query.orderBy('shipment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: ['client', 'agent', 'createdBy'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { trackingNumber },
      relations: ['client', 'agent', 'createdBy'],
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
    console.log(updateShipmentDto);

    const shipment = await this.findOne(id);

    console.log(shipment);

    // Track status changes
    if (updateShipmentDto.status && updateShipmentDto.status !== shipment.status) {
      await this.trackingService.createEvent({
        shipmentId: id,
        status: updateShipmentDto.status,
        location:
          updateShipmentDto.currentLocationCountry ||
          updateShipmentDto.currentLocation ||
          shipment.currentLocation ||
          shipment.origin,
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

  async assignAgent(id: string, agentId: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    shipment.agentId = agentId;
    return this.shipmentsRepository.save(shipment);
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
