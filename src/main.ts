// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { join } from 'path';
// import * as compression from 'compression';

import { NestExpressApplication } from '@nestjs/platform-express';
import { OriginCountry } from './shipments/enums/origin-country.enum';
import { DestinationCountry } from './shipments/enums/destination-country.enum';

async function bootstrap() {
  console.log('OriginCountry Enum:', OriginCountry);
  console.log('DestinationCountry Enum:', DestinationCountry);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
          fontSrc: ["'self'", 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  // app.use(compression());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static files from the 'public' directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '',
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Don't crash on extra fields, just strip them
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Logistics Management API')
    .setDescription('International Logistics & Tracking Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('shipments', 'Shipment management')
    .addTag('tracking', 'Tracking & events')
    .addTag('warehouse', 'Warehouse operations')
    .addTag('billing', 'Billing & payments')
    .addTag('notifications', 'Notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`📋 API Base URL: http://localhost:${port}/api/v1`);
  console.log(`🌐 Frontend: http://localhost:${port}`);
}

bootstrap();
