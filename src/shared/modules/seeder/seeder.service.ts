import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/entities/role.entity';
import { UserRole } from '../../../users/enums/user-role.enum';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting seeding process...');
    console.log('hello world');

    try {
      await this.seedRoles();
      await this.seedUsers();

      this.logger.log('Seeding completed successfully!');
    } catch (error) {
      this.logger.error('Seeding failed:', error);
      throw error;
    }
  }

  private async seedRoles(): Promise<void> {
    const roles = [
      { name: 'admin', description: 'Administrator role' },
      { name: 'user', description: 'Regular user role' },
      { name: 'moderator', description: 'Moderator role' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`Created role: ${roleData.name}`);
      } else {
        this.logger.log(`Role ${roleData.name} already exists`);
      }
    }
  }

  private async seedUsers(): Promise<void> {
    // Vérifier si des utilisateurs existent déjà
    const userCount = await this.userRepository.count();

    if (userCount > 0) {
      this.logger.log('Users already exist, skipping user seeding');
      return;
    }

    // Créer un utilisateur administrateur
    const adminUser = this.userRepository.create({
      email: 'admin@example.com',
      password: '$2b$10$EpRt1.yyyQ65oX55.UhZ8uLhVpT6xUZ3vL8.q.YyyQ65oX55.UhZ8', // Mot de passe hashé "password"
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await this.userRepository.save(adminUser);
    this.logger.log('Created admin user');
  }
}
