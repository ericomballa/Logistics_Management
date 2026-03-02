import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../users/schemas/user.schema';
import { Role } from '../../../users/schemas/role.schema';
import { UserRole } from '../../../users/enums/user-role.enum';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Role.name)
    private roleModel: Model<Role>,
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
      const existingRole = await this.roleModel.findOne({ name: roleData.name }).exec();

      if (!existingRole) {
        const role = await this.roleModel.create(roleData);
        await role.save();
        this.logger.log(`Created role: ${roleData.name}`);
      } else {
        this.logger.log(`Role ${roleData.name} already exists`);
      }
    }
  }

  private async seedUsers(): Promise<void> {
    // Vérifier si des utilisateurs existent déjà
    const userCount = await this.userModel.countDocuments().exec();

    if (userCount > 0) {
      this.logger.log('Users already exist, skipping user seeding');
      return;
    }

    // Créer un utilisateur administrateur
    const adminUser = await this.userModel.create({
      email: 'admin@example.com',
      password: '$2b$10$EpRt1.yyyQ65oX55.UhZ8uLhVpT6xUZ3vL8.q.YyyQ65oX55.UhZ8', // Mot de passe hashé "password"
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await adminUser.save();
    this.logger.log('Created admin user');
  }
}
