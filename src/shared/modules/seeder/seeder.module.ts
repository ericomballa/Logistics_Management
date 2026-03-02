import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { DatabaseEntityModule } from '../database-entity.module';

@Module({
  imports: [DatabaseEntityModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
