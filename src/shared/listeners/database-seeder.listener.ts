import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SeedService } from '../services/seed.service';

@Injectable()
export class DatabaseSeederListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederListener.name);

  constructor(private readonly seedService: SeedService) {}

  async onApplicationBootstrap() {
    this.logger.log('Application initialized, starting database seeding...');
    await this.seedService.runSeed();
  }
}