import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SeederService } from '../modules/seeder/seeder.service';

@Injectable()
export class AppBootstrapListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppBootstrapListener.name);

  constructor(private readonly seederService: SeederService) {}

  async onApplicationBootstrap() {
    this.logger.log('Application initialized, starting seeding...');
    await this.seederService.seed();
  }
}