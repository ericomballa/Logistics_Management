import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { TrackingModule } from './tracking/tracking.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SeedModule } from './shared/modules/seed.module';
import { AuditModule } from './audit/audit.module';

// Import des schémas Mongoose
import { User, UserSchema } from './users/schemas/user.schema';
import { Agency, AgencySchema } from './users/schemas/agency.schema';
import { Role, RoleSchema } from './users/schemas/role.schema';
import { Shipment, ShipmentSchema } from './shipments/schemas/shipment.schema';
import { Invoice, InvoiceSchema } from './billing/schemas/invoice.schema';
import { Payment, PaymentSchema } from './billing/schemas/payment.schema';
import { Tariff, TariffSchema } from './billing/schemas/tariff.schema';
import { TariffRule, TariffRuleSchema } from './billing/schemas/tariff-rule.schema';
import { Warehouse, WarehouseSchema } from './warehouse/schemas/warehouse.schema';
import { WarehouseInventory, WarehouseInventorySchema } from './warehouse/schemas/warehouse-inventory.schema';
import { WhatsappUser, WhatsappUserSchema } from './whatsapp/schemas/whatsapp-user.schema';
import { Conversation, ConversationSchema } from './whatsapp/schemas/conversation.schema';
import { Message, MessageSchema } from './whatsapp/schemas/message.schema';
import { AuditLog, AuditLogSchema } from './audit/schemas/audit-log.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ MongoDB - Base de données unique
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'logistics_db',
    }),

    // Enregistrement des schémas globaux
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Role.name, schema: RoleSchema },
      { name: Shipment.name, schema: ShipmentSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Tariff.name, schema: TariffSchema },
      { name: TariffRule.name, schema: TariffRuleSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: WarehouseInventory.name, schema: WarehouseInventorySchema },
      { name: WhatsappUser.name, schema: WhatsappUserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    AuthModule,
    UsersModule,
    ShipmentsModule,
    TrackingModule,
    WarehouseModule,
    BillingModule,
    NotificationsModule,
    ReportsModule,
    HealthModule,
    WhatsappModule,
    SeedModule,
    AuditModule,
  ],
})
export class AppModule { }
