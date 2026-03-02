import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { UsersService } from '../../../users/users.service';
import { WarehouseService } from '../../../warehouse/warehouse.service';
import { UserRole } from '../../../users/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const warehouseService = app.get(WarehouseService);

  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Agencies
    console.log('📦 Creating agencies...');
    const cmAgency = await usersService.createAgency({
      name: 'Cameroon Main Office',
      code: 'CM-MAIN',
      city: 'Douala',
      country: 'Cameroon',
      address: 'Akwa, Douala',
      phone: '+237670000000',
      email: 'douala@logistics.cm',
    });

    const ydAgency = await usersService.createAgency({
      name: 'Yaoundé Branch',
      code: 'CM-YDE',
      city: 'Yaoundé',
      country: 'Cameroon',
      address: 'Centre-ville, Yaoundé',
      phone: '+237670000001',
      email: 'yaounde@logistics.cm',
    });

    // 2. Create Users
    console.log('👥 Creating users...');
    await usersService.create({
      email: 'eric@logistics.cm',
      password: 'Tititata85*',
      name: 'Erico',
      phone: '+237670000011',
      role: UserRole.SUPER_ADMIN,
    });
    await usersService.create({
      email: 'admin@logistics.cm',
      password: 'Admin@123',
      name: 'Super Admin',
      phone: '+237670000000',
      role: UserRole.SUPER_ADMIN,
    });

    await usersService.create({
      email: 'manager@logistics.cm',
      password: 'Manager@123',
      name: 'John Manager',
      phone: '+237670000001',
      role: UserRole.ADMIN,
      agencyId: cmAgency.id,
    });

    await usersService.create({
      email: 'agent1@logistics.cm',
      password: 'Agent@123',
      name: 'Agent Douala',
      phone: '+237670000002',
      role: UserRole.AGENT,
      agencyId: cmAgency.id,
    });

    await usersService.create({
      email: 'agent2@logistics.cm',
      password: 'Agent@123',
      name: 'Agent Yaoundé',
      phone: '+237670000003',
      role: UserRole.AGENT,
      agencyId: ydAgency.id,
    });

    await usersService.create({
      email: 'secretary@logistics.cm',
      password: 'Secretary@123',
      name: 'Secretary',
      phone: '+237670000004',
      role: UserRole.SECRETARY,
      agencyId: cmAgency.id,
    });

    await usersService.create({
      email: 'client@example.com',
      password: 'Client@123',
      name: 'Test Client',
      phone: '+237670000004',
      role: UserRole.CLIENT,
    });

    // 3. Create Warehouses
    console.log('🏭 Creating warehouses...');
    await warehouseService.createWarehouse({
      name: 'Shanghai Warehouse',
      code: 'CN-SHA',
      country: 'China',
      city: 'Shanghai',
      address: 'Pudong District, Shanghai',
      phone: '+86-21-12345678',
      email: 'shanghai@logistics.com',
      capacity: 10000,
    });

    await warehouseService.createWarehouse({
      name: 'Dubai Hub',
      code: 'AE-DXB',
      country: 'Dubai',
      city: 'Dubai',
      address: 'Jebel Ali Free Zone',
      phone: '+971-4-1234567',
      email: 'dubai@logistics.com',
      capacity: 8000,
    });

    await warehouseService.createWarehouse({
      name: 'Douala Main Warehouse',
      code: 'CM-DLA',
      country: 'Cameroon',
      city: 'Douala',
      address: 'Zone Industrielle, Bonabéri',
      phone: '+237670000010',
      email: 'douala.warehouse@logistics.cm',
      capacity: 5000,
    });

    await warehouseService.createWarehouse({
      name: 'Yaoundé Distribution Center',
      code: 'CM-YDE',
      country: 'Cameroon',
      city: 'Yaoundé',
      address: 'Mvan, Yaoundé',
      phone: '+237670000011',
      email: 'yaounde.warehouse@logistics.cm',
      capacity: 3000,
    });

    console.log('✅ Seeding completed successfully!');
    console.log('\n📊 Created:');
    console.log(`  - 2 Agencies`);
    console.log(`  - 5 Users (1 Super Admin, 1 Admin, 2 Agents, 1 Client)`);
    console.log(`  - 4 Warehouses (China, Dubai, Douala, Yaoundé)`);
    console.log('\n🔐 Default credentials:');
    console.log('  Super Admin: admin@logistics.cm / Admin@123');
    console.log('  Manager: manager@logistics.cm / Manager@123');
    console.log('  Agent 1: agent1@logistics.cm / Agent@123');
    console.log('  Agent 2: agent2@logistics.cm / Agent@123');
    console.log('  Client: client@example.com / Client@123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
