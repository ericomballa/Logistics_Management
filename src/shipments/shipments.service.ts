import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { Shipment } from './schemas/shipment.schema';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { TrackingService } from '../tracking/tracking.service';
import { ShipmentStatus } from './enums/shipment-status.enum';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '../audit/enums/audit-action-type.enum';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectModel(Shipment.name)
    private shipmentModel: Model<Shipment>,
    private trackingService: TrackingService,
    private auditService: AuditService,
  ) { }

  async create(createShipmentDto: CreateShipmentDto, userId: string, performedBy?: string): Promise<Shipment> {
    // Default Origin/Destination if missing
    console.log(createShipmentDto);

    const origin = createShipmentDto.origin || 'DUBAI';
    const destination = createShipmentDto.destination || 'CAMEROON';

    const trackingNumber = this.generateTrackingNumber(origin);

    // Map payload fields to schema fields
    const receiverName = createShipmentDto.receiverName || createShipmentDto.recipientName;
    const receiverAddress = createShipmentDto.receiverAddress || createShipmentDto.recipientAddress;
    const receiverPhone = createShipmentDto.receiverPhone || '000000000';

    // Handle date
    let estimatedDate = createShipmentDto.estimatedDeliveryDate;
    if (typeof estimatedDate === 'string') {
      estimatedDate = new Date(estimatedDate);
    }

    const shipment = await this.shipmentModel.create({
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
      clientId: createShipmentDto.clientId ? new Types.ObjectId(createShipmentDto.clientId) : new Types.ObjectId(userId),
      createdById: new Types.ObjectId(userId),
      status: ShipmentStatus.PENDING,
      description: createShipmentDto.description || `${createShipmentDto.serviceType || 'Standard'} Shipment (${createShipmentDto.dimensions || 'N/A'})`
    });

    const savedShipment = await shipment.save();

    // Create initial tracking event
    await this.trackingService.createEvent({
      shipmentId: savedShipment._id.toString(),
      status: ShipmentStatus.PENDING,
      location: origin as string,
      country: origin as string,
      description: 'Shipment created',
      actor: 'SYSTEM',
    });

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'SHIPMENT',
      savedShipment._id.toString(),
      performedBy,
      userId,
      `Created shipment ${savedShipment.trackingNumber} for client ${savedShipment.clientId}`
    );

    return savedShipment;
  }

  async findAll(filters?: any): Promise<{ data: Shipment[]; total: number; page: number; limit: number }> {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.origin) {
      query.origin = filters.origin;
    }

    if (filters?.destination) {
      query.destination = filters.destination;
    }

    if (filters?.clientId) {
      query.clientId = new Types.ObjectId(filters.clientId);
    }

    if (filters?.agentId) {
      query.agentId = new Types.ObjectId(filters.agentId);
    }

    if (filters?.createdById) {
      query.createdById = new Types.ObjectId(filters.createdById);
    }

    if (filters?.agentOrCreatorId) {
      const id = new Types.ObjectId(filters.agentOrCreatorId);
      query.$or = [{ agentId: id }, { createdById: id }];
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { trackingNumber: searchRegex },
        { receiverName: searchRegex },
        { senderName: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.shipmentModel
        .find(query)
        .populate('clientId', 'name email phone')
        .populate('agentId', 'name email phone')
        .populate('createdById', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.shipmentModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentModel
      .findById(id)
      .populate('clientId', 'name email phone')
      .populate('agentId', 'name email phone')
      .populate('createdById', 'name email phone')
      .exec();

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentModel
      .findOne({ trackingNumber })
      .populate('clientId', 'name email phone')
      .populate('agentId', 'name email phone')
      .populate('createdById', 'name email phone')
      .exec();

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async update(
    id: string,
    updateShipmentDto: UpdateShipmentDto,
    userId?: string,
    performedBy?: string,
  ): Promise<Shipment> {
    console.log(updateShipmentDto);

    const shipment = await this.findOne(id);

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

    const updatedShipment = await this.shipmentModel
      .findByIdAndUpdate(
        id,
        { $set: updateShipmentDto },
        { new: true, runValidators: true },
      )
      .populate('clientId', 'name email phone')
      .populate('agentId', 'name email phone')
      .populate('createdById', 'name email phone')
      .exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.UPDATE,
      'SHIPMENT',
      updatedShipment._id.toString(),
      performedBy || 'System',
      userId || null,
      `Updated shipment ${updatedShipment.trackingNumber} status to ${updateShipmentDto.status || 'unchanged'}`
    );

    return updatedShipment;
  }

  async remove(id: string, userId?: string, performedBy?: string): Promise<void> {
    const shipment = await this.findOne(id);
    await this.shipmentModel.findByIdAndDelete(id).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.DELETE,
      'SHIPMENT',
      shipment._id.toString(),
      performedBy || 'System',
      userId || null,
      `Deleted shipment ${shipment.trackingNumber}`
    );
  }

  async assignAgent(id: string, agentId: string): Promise<Shipment> {
    const updatedShipment = await this.shipmentModel
      .findByIdAndUpdate(
        id,
        { $set: { agentId: new Types.ObjectId(agentId) } },
        { new: true },
      )
      .exec();

    return updatedShipment;
  }

  async getStats() {
    const total = await this.shipmentModel.countDocuments().exec();
    const pending = await this.shipmentModel.countDocuments({ status: ShipmentStatus.PENDING }).exec();
    const inTransit = await this.shipmentModel.countDocuments({ status: ShipmentStatus.IN_TRANSIT }).exec();
    const delivered = await this.shipmentModel.countDocuments({ status: ShipmentStatus.DELIVERED }).exec();

    return { total, pending, inTransit, delivered };
  }

  private generateTrackingNumber(origin: string): string {
    const prefix = origin.substring(0, 2).toUpperCase();
    const random = nanoid(8).toUpperCase();
    return `${prefix}-${random}`;
  }
}
