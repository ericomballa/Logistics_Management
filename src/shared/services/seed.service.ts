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
    console.log('hello word =============>');

    const adminUser = await this.usersService.findByEmail('manager@logistics.cm');
    console.log(adminUser);

    if (adminUser) {
      this.logger.log('Database already seeded, skipping seeding process');
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

      // 2. Create Users
      this.logger.log('👥 Creating users...');
      console.log('je cree admin 2');

      await this.usersService.create({
        email: 'admin@logistics.cm',
        password: 'Admin@123',
        name: 'Super Admin',
        phone: '+237670000000',
        role: UserRole.SUPER_ADMIN,
      });

      await this.usersService.create({
        email: 'manager@logistics.cm',
        password: 'Manager@123',
        name: 'John Manager',
        phone: '+237670000001',
        role: UserRole.ADMIN,
        agencyId: cmAgency.id,
      });

      await this.usersService.create({
        email: 'agent1@logistics.cm',
        password: 'Agent@123',
        name: 'Agent Douala',
        phone: '+237670000002',
        role: UserRole.AGENT,
        agencyId: cmAgency.id,
      });

      await this.usersService.create({
        email: 'agent2@logistics.cm',
        password: 'Agent@123',
        name: 'Agent Yaoundé',
        phone: '+237670000003',
        role: UserRole.AGENT,
        agencyId: ydAgency.id,
      });

      await this.usersService.create({
        email: 'secretary@logistics.cm',
        password: 'Secretary@123',
        name: 'Secretary',
        phone: '+237670000004',
        role: UserRole.SECRETARY,
        agencyId: cmAgency.id,
      });

      await this.usersService.create({
        email: 'client@example.com',
        password: 'Client@123',
        name: 'Test Client',
        phone: '+237670000004',
        role: UserRole.CLIENT,
      });

      // 3. Create Warehouses
      this.logger.log('🏭 Creating warehouses...');
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

      this.logger.log('✅ Seeding completed successfully!');
      this.logger.log('\n📊 Created:');
      this.logger.log(`  - 2 Agencies`);
      this.logger.log(`  - 5 Users (1 Super Admin, 1 Admin, 2 Agents, 1 Client)`);
      this.logger.log(`  - 4 Warehouses (China, Dubai, Douala, Yaoundé)`);
      this.logger.log('\n🔐 Default credentials:');
      this.logger.log('  Super Admin: admin@logistics.cm / Admin@123');
      this.logger.log('  Manager: manager@logistics.cm / Manager@123');
      this.logger.log('  Agent 1: agent1@logistics.cm / Agent@123');
      this.logger.log('  Agent 2: agent2@logistics.cm / Agent@123');
      this.logger.log('  Client: client@example.com / Client@123');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }
}
