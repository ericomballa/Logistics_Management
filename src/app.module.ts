import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { TrackingModule } from './tracking/tracking.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';

// @Module({
//   imports: [
//     AuthModule,
//     UsersModule,
//     ShipmentsModule,
//     TrackingModule,
//     WarehouseModule,
//     BillingModule,
//     NotificationsModule,
//     ReportsModule,
//     HealthModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Agency } from './users/entities/agency.entity';
import { Role } from './users/entities/role.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WhatsappUser } from './whatsapp/entities/whatsapp-user.entity';
import { Conversation } from './whatsapp/entities/conversation.entity';
import { Message } from './whatsapp/entities/message.entity';
import { SeedModule } from './shared/modules/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'logistics',
      url: process.env.DATABASE_URL,
      entities: [User, Agency, Role, WhatsappUser, Conversation, Message],
      synchronize: true, // ❗ false en prod
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: true, // ⭐ recommandé
    }),

    ConfigModule.forRoot({
      isGlobal: true, // ⭐⭐ CRUCIAL
    }),

    // ✅ MongoDB (TRACKING)
    MongooseModule.forRoot(process.env.MONGODB_URI),

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
    SeedModule, // Ajouter le module de seeding
  ],
})
export class AppModule { }
