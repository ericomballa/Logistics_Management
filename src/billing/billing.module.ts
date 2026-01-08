import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { TariffRule } from './entities/tariff-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment, TariffRule])],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
