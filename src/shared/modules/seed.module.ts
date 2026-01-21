import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { SeedService } from '../services/seed.service';
import { UsersModule } from '../../users/users.module';
import { WarehouseModule } from '../../warehouse/warehouse.module';

@Module({
  imports: [
    UsersModule,
    WarehouseModule,
  ],
  providers: [SeedService],
})
export class SeedModule implements OnApplicationBootstrap {
  constructor(private readonly seedService: SeedService) {}

  async onApplicationBootstrap() {
    console.log('======= SEED MODULE BOOTSTRAP =======');
    await this.seedService.runSeed();
  }
}