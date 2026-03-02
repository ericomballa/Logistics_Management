import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { WarehouseService } from '../../warehouse/warehouse.service';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly warehouseService: WarehouseService,
  ) {}

  async runSeed(): Promise<void> {
    // Vérifier si le seeding a déjà été effectué en cherchant un utilisateur admin
    console.log('======= SEED SERVICE: Checking if database is already seeded =======');

    const adminUser = await this.usersService.findByEmail('manager@logistics.cm');

    if (adminUser) {
      this.logger.log('✅ Database already seeded, skipping seeding process');
      return;
    }

    this.logger.log('🌱 Starting database seeding...');

    try {
      // 1. Create Agencies
      this.logger.log('📦 Creating agencies...');
      const cmAgency = await this.usersService.createAgency({
        name: 'Cameroon Main Office',
        code: 'CM-MAIN',
        city: 'Douala',
        country: 'Cameroon',
        address: 'Akwa, Douala',
        phone: '+237670000000',
        email: 'douala@logistics.cm',
      });

      const ydAgency = await this.usersService.createAgency({
        name: 'Yaoundé Branch',
        code: 'CM-YDE',
        city: 'Yaoundé',
        country: 'Cameroon',
        address: 'Centre-ville, Yaoundé',
        phone: '+237670000001',
        email: 'yaounde@logistics.cm',
      });

      this.logger.log(`✅ Created agencies: ${cmAgency.name}, ${ydAgency.name}`);

      // 2. Create Users
      this.logger.log('👥 Creating users...');

      // Super Admin - Erico
      try {
        await this.usersService.create({
          email: 'eric@logistics.cm',
          password: 'Tititata85*',
          name: 'Erico',
          phone: '+237670000011',
          role: UserRole.SUPER_ADMIN,
        });
        this.logger.log('✅ Created user: eric@logistics.cm (SUPER_ADMIN)');
      } catch (error) {
        this.logger.warn('User eric@logistics.cm already exists');
      }

      // Super Admin
      try {
        await this.usersService.create({
          email: 'admin@logistics.cm',
          password: 'Admin@123',
          name: 'Super Admin',
          phone: '+237670000000',
          role: UserRole.SUPER_ADMIN,
        });
        this.logger.log('✅ Created user: admin@logistics.cm (SUPER_ADMIN)');
      } catch (error) {
        this.logger.warn('User admin@logistics.cm already exists');
      }

      // Admin - Manager
      try {
        await this.usersService.create({
          email: 'manager@logistics.cm',
          password: 'Manager@123',
          name: 'John Manager',
          phone: '+237670000001',
          role: UserRole.ADMIN,
          agencyId: cmAgency._id.toString(),
        });
        this.logger.log('✅ Created user: manager@logistics.cm (ADMIN)');
      } catch (error) {
        this.logger.warn('User manager@logistics.cm already exists');
      }

      // Agent 1 - Douala
      try {
        await this.usersService.create({
          email: 'agent1@logistics.cm',
          password: 'Agent@123',
          name: 'Agent Douala',
          phone: '+237670000002',
          role: UserRole.AGENT,
          agencyId: cmAgency._id.toString(),
        });
        this.logger.log('✅ Created user: agent1@logistics.cm (AGENT - Douala)');
      } catch (error) {
        this.logger.warn('User agent1@logistics.cm already exists');
      }

      // Agent 2 - Yaoundé
      try {
        await this.usersService.create({
          email: 'agent2@logistics.cm',
          password: 'Agent@123',
          name: 'Agent Yaoundé',
          phone: '+237670000003',
          role: UserRole.AGENT,
          agencyId: ydAgency._id.toString(),
        });
        this.logger.log('✅ Created user: agent2@logistics.cm (AGENT - Yaoundé)');
      } catch (error) {
        this.logger.warn('User agent2@logistics.cm already exists');
      }

      // Secretary
      try {
        await this.usersService.create({
          email: 'secretary@logistics.cm',
          password: 'Secretary@123',
          name: 'Secretary',
          phone: '+237670000004',
          role: UserRole.SECRETARY,
          agencyId: cmAgency._id.toString(),
        });
        this.logger.log('✅ Created user: secretary@logistics.cm (SECRETARY)');
      } catch (error) {
        this.logger.warn('User secretary@logistics.cm already exists');
      }

      // Client
      try {
        await this.usersService.create({
          email: 'client@example.com',
          password: 'Client@123',
          name: 'Test Client',
          phone: '+237670000005',
          role: UserRole.CLIENT,
        });
        this.logger.log('✅ Created user: client@example.com (CLIENT)');
      } catch (error) {
        this.logger.warn('User client@example.com already exists');
      }

      // 3. Create Warehouses
      this.logger.log('🏭 Creating warehouses...');

      try {
        await this.warehouseService.createWarehouse({
          name: 'Shanghai Warehouse',
          code: 'CN-SHA',
          country: 'China',
          city: 'Shanghai',
          address: 'Pudong District, Shanghai',
          phone: '+86-21-12345678',
          email: 'shanghai@logistics.com',
          capacity: 10000,
        });
        this.logger.log('✅ Created warehouse: Shanghai Warehouse');
      } catch (error) {
        this.logger.warn('Warehouse CN-SHA already exists');
      }

      try {
        await this.warehouseService.createWarehouse({
          name: 'Dubai Hub',
          code: 'AE-DXB',
          country: 'Dubai',
          city: 'Dubai',
          address: 'Jebel Ali Free Zone',
          phone: '+971-4-1234567',
          email: 'dubai@logistics.com',
          capacity: 8000,
        });
        this.logger.log('✅ Created warehouse: Dubai Hub');
      } catch (error) {
        this.logger.warn('Warehouse AE-DXB already exists');
      }

      try {
        await this.warehouseService.createWarehouse({
          name: 'Douala Main Warehouse',
          code: 'CM-DLA',
          country: 'Cameroon',
          city: 'Douala',
          address: 'Zone Industrielle, Bonabéri',
          phone: '+237670000010',
          email: 'douala.warehouse@logistics.cm',
          capacity: 5000,
        });
        this.logger.log('✅ Created warehouse: Douala Main Warehouse');
      } catch (error) {
        this.logger.warn('Warehouse CM-DLA already exists');
      }

      try {
        await this.warehouseService.createWarehouse({
          name: 'Yaoundé Distribution Center',
          code: 'CM-YDE',
          country: 'Cameroon',
          city: 'Yaoundé',
          address: 'Mvan, Yaoundé',
          phone: '+237670000011',
          email: 'yaounde.warehouse@logistics.cm',
          capacity: 3000,
        });
        this.logger.log('✅ Created warehouse: Yaoundé Distribution Center');
      } catch (error) {
        this.logger.warn('Warehouse CM-YDE already exists');
      }

      this.logger.log('✅ Seeding completed successfully!');
      this.logger.log('\n📊 Created:');
      this.logger.log('  - 2 Agencies (CM-MAIN, CM-YDE)');
      this.logger.log('  - 7 Users (2 SUPER_ADMIN, 1 ADMIN, 2 AGENTS, 1 SECRETARY, 1 CLIENT)');
      this.logger.log('  - 4 Warehouses (China, Dubai, Douala, Yaoundé)');
      this.logger.log('\n🔐 Default credentials:');
      this.logger.log('  Super Admin: eric@logistics.cm / Tititata85*');
      this.logger.log('  Super Admin: admin@logistics.cm / Admin@123');
      this.logger.log('  Manager: manager@logistics.cm / Manager@123');
      this.logger.log('  Agent 1: agent1@logistics.cm / Agent@123');
      this.logger.log('  Agent 2: agent2@logistics.cm / Agent@123');
      this.logger.log('  Secretary: secretary@logistics.cm / Secretary@123');
      this.logger.log('  Client: client@example.com / Client@123');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }
}
