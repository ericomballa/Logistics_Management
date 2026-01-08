import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Agency } from './entities/agency.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { UserRole } from './enums/user-role.enum';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
  ) {}

  // ==================== USER METHODS ====================

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate agency if provided
    if (createUserDto.agencyId) {
      const agency = await this.agenciesRepository.findOne({
        where: { id: createUserDto.agencyId },
      });

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
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(filters?: {
    role?: UserRole;
    agencyId?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.agency', 'agency')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.phone',
        'user.role',
        'user.isActive',
        'user.agencyId',
        'user.lastLoginAt',
        'user.createdAt',
        'agency.id',
        'agency.name',
        'agency.code',
      ]);

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.agencyId) {
      query.andWhere('user.agencyId = :agencyId', {
        agencyId: filters.agencyId,
      });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', {
        isActive: filters.isActive, // TypeORM attend un boolean ici, maintenant ok
      });
    }

    return query.orderBy('user.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['agency'],
      select: [
        'id',
        'email',
        'name',
        'phone',
        'role',
        'isActive',
        'agencyId',
        'lastLoginAt',
        'lastLoginIp',
        'notes',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['agency'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check email uniqueness if changed
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email, id: Not(id) },
      });

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
      const agency = await this.agenciesRepository.findOne({
        where: { id: updateUserDto.agencyId },
      });

      if (!agency) {
        throw new BadRequestException('Agency not found');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Prevent deletion of super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete super admin');
    }

    await this.usersRepository.remove(user);
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<User> {
    return this.update(id, { isActive: true });
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);

    // In a real app, you'd join with shipments table
    // This is a placeholder
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shipmentCount: 0,
      activeShipments: 0,
      deliveredShipments: 0,
      memberSince: user.createdAt,
    };
  }

  // ==================== AGENCY METHODS ====================

  async createAgency(createAgencyDto: CreateAgencyDto): Promise<Agency> {
    // Check if code already exists
    const existingAgency = await this.agenciesRepository.findOne({
      where: { code: createAgencyDto.code },
    });

    if (existingAgency) {
      throw new ConflictException('Agency code already exists');
    }

    const agency = this.agenciesRepository.create(createAgencyDto);
    return this.agenciesRepository.save(agency);
  }

  async findAllAgencies(filters?: { isActive?: boolean; country?: string }): Promise<Agency[]> {
    const query = this.agenciesRepository.createQueryBuilder('agency');

    if (filters?.isActive !== undefined) {
      query.andWhere('agency.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.country) {
      query.andWhere('agency.country = :country', { country: filters.country });
    }

    return query
      .orderBy('agency.name', 'ASC')
      .select([
        'agency.id',
        'agency.name',
        'agency.code',
        'agency.address',
        'agency.city',
        'agency.country',
        'agency.phone',
        'agency.email',
        'agency.latitude',
        'agency.longitude',
        'agency.isActive',
        'agency.description',
        'agency.createdAt',
        'agency.updatedAt',
      ])
      .getMany();
  }

  async findAgency(id: string): Promise<Agency> {
    const agency = await this.agenciesRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  async findAgencyByCode(code: string): Promise<Agency | null> {
    return this.agenciesRepository.findOne({
      where: { code },
    });
  }

  async updateAgency(id: string, updateAgencyDto: UpdateAgencyDto): Promise<Agency> {
    const agency = await this.findAgency(id);

    // Check code uniqueness if changed
    if (updateAgencyDto.code && updateAgencyDto.code !== agency.code) {
      const existingAgency = await this.agenciesRepository.findOne({
        where: { code: updateAgencyDto.code },
      });

      if (existingAgency) {
        throw new ConflictException('Agency code already exists');
      }
    }

    Object.assign(agency, updateAgencyDto);
    return this.agenciesRepository.save(agency);
  }

  async removeAgency(id: string): Promise<void> {
    const agency = await this.findAgency(id);

    // Check if agency has users
    if (agency.users && agency.users.length > 0) {
      throw new BadRequestException(
        'Cannot delete agency with active users. Please reassign or remove users first.',
      );
    }

    await this.agenciesRepository.remove(agency);
  }

  async getAgencyStats(id: string) {
    const agency = await this.findAgency(id);

    const userCount = await this.usersRepository.count({
      where: { agencyId: id },
    });

    const activeUsers = await this.usersRepository.count({
      where: { agencyId: id, isActive: true },
    });

    return {
      agencyId: agency.id,
      name: agency.name,
      code: agency.code,
      userCount,
      activeUsers,
      inactiveUsers: userCount - activeUsers,
      // In real app, add shipment stats
      shipmentCount: 0,
      createdAt: agency.createdAt,
    };
  }
}
