import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { Agency } from './schemas/agency.schema';
import { Shipment } from '../shipments/schemas/shipment.schema';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { UserRole } from './enums/user-role.enum';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '../audit/enums/audit-action-type.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Agency.name)
    private agencyModel: Model<Agency>,
    @InjectModel(Shipment.name)
    private shipmentModel: Model<Shipment>,
    private auditService: AuditService,
  ) { }

  // ==================== USER METHODS ====================

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate agency if provided
    if (createUserDto.agencyId) {
      const agency = await this.agencyModel.findById(createUserDto.agencyId).exec();

      if (!agency) {
        throw new BadRequestException('Agency not found');
      }

      if (!agency.isActive) {
        throw new BadRequestException('Agency is inactive');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.CREATE,
      'USER',
      savedUser._id.toString(),
      savedUser.name,
      savedUser._id.toString(),
      `Created user ${savedUser.name} with role ${savedUser.role}`
    );

    return savedUser;
  }

  async findAll(filters?: {
    role?: UserRole;
    agencyId?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.agencyId) {
      query.agencyId = new Types.ObjectId(filters.agencyId);
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const users = await this.userModel
      .find(query)
      .populate('agencyId', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();

    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate('agencyId', 'name code address city country phone email')
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email })
      .populate('agencyId')
      .select('+password')
      .exec();

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('+password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check email uniqueness if changed
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: new Types.ObjectId(id) },
      }).exec();

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Validate agency if changed
    if (updateUserDto.agencyId) {
      const agency = await this.agencyModel.findById(updateUserDto.agencyId).exec();

      if (!agency) {
        throw new BadRequestException('Agency not found');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: updateUserDto },
        { new: true, runValidators: true },
      )
      .populate('agencyId')
      .select('-password')
      .exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.UPDATE,
      'USER',
      updatedUser._id.toString(),
      updatedUser.name,
      updatedUser._id.toString(),
      `Updated user ${updatedUser.name} role from ${user.role} to ${updateUserDto.role || user.role}`
    );

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Prevent deletion of super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete super admin');
    }

    await this.userModel.findByIdAndDelete(id).exec();

    // Log audit action
    await this.auditService.logAction(
      AuditActionType.DELETE,
      'USER',
      user._id.toString(),
      user.name,
      user._id.toString(),
      `Deleted user ${user.name} with role ${user.role}`
    );
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<User> {
    return this.update(id, { isActive: true });
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    }).exec();
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);

    const objectId = new Types.ObjectId(id);

    // Count shipments where the user is either the creator or the assigned agent
    const shipmentCount = await this.shipmentModel.countDocuments({
      $or: [{ clientId: objectId }, { agentId: objectId }],
    }).exec();

    const activeShipments = await this.shipmentModel.countDocuments({
      $or: [
        { clientId: objectId, status: { $ne: ShipmentStatus.DELIVERED } },
        { agentId: objectId, status: { $ne: ShipmentStatus.DELIVERED } },
      ],
    }).exec();

    const deliveredShipments = await this.shipmentModel.countDocuments({
      $or: [
        { clientId: objectId, status: ShipmentStatus.DELIVERED },
        { agentId: objectId, status: ShipmentStatus.DELIVERED },
      ],
    }).exec();

    return {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      shipmentCount,
      activeShipments,
      deliveredShipments,
      memberSince: user.createdAt as any,
    };
  }

  // ==================== AGENCY METHODS ====================

  async createAgency(createAgencyDto: CreateAgencyDto): Promise<Agency> {
    // Check if code already exists
    const existingAgency = await this.agencyModel.findOne({ code: createAgencyDto.code }).exec();

    if (existingAgency) {
      throw new ConflictException('Agency code already exists');
    }

    const agency = await this.agencyModel.create(createAgencyDto);
    return agency.save();
  }

  async findAllAgencies(filters?: { isActive?: boolean; country?: string }): Promise<Agency[]> {
    const query: any = {};

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.country) {
      query.country = filters.country;
    }

    return this.agencyModel.find(query).sort({ name: 1 }).exec();
  }

  async findAgency(id: string): Promise<Agency> {
    const agency = await this.agencyModel.findById(id).exec();

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  async findAgencyByCode(code: string): Promise<Agency | null> {
    return this.agencyModel.findOne({ code }).exec();
  }

  async updateAgency(id: string, updateAgencyDto: UpdateAgencyDto): Promise<Agency> {
    const agency = await this.findAgency(id);

    // Check code uniqueness if changed
    if (updateAgencyDto.code && updateAgencyDto.code !== agency.code) {
      const existingAgency = await this.agencyModel.findOne({
        code: updateAgencyDto.code,
        _id: { $ne: new Types.ObjectId(id) },
      }).exec();

      if (existingAgency) {
        throw new ConflictException('Agency code already exists');
      }
    }

    const updatedAgency = await this.agencyModel
      .findByIdAndUpdate(
        id,
        { $set: updateAgencyDto },
        { new: true, runValidators: true },
      )
      .exec();

    return updatedAgency;
  }

  async removeAgency(id: string): Promise<void> {
    const agency = await this.findAgency(id);

    // Check if agency has users
    const usersCount = await this.userModel.countDocuments({ agencyId: new Types.ObjectId(id) }).exec();

    if (usersCount > 0) {
      throw new BadRequestException(
        'Cannot delete agency with active users. Please reassign or remove users first.',
      );
    }

    await this.agencyModel.findByIdAndDelete(id).exec();
  }

  async getAgencyStats(id: string) {
    const agency = await this.findAgency(id);

    const objectId = new Types.ObjectId(id);

    const userCount = await this.userModel.countDocuments({ agencyId: objectId }).exec();

    const activeUsers = await this.userModel.countDocuments({
      agencyId: objectId,
      isActive: true,
    }).exec();

    return {
      agencyId: agency._id.toString(),
      name: agency.name,
      code: agency.code,
      userCount,
      activeUsers,
      inactiveUsers: userCount - activeUsers,
      // In real app, add shipment stats
      shipmentCount: 0,
      createdAt: agency.createdAt as any,
    };
  }
}
