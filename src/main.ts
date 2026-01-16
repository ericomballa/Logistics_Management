// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { join } from 'path';
// import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  // app.use(compression());

  // CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // Serve static files from the 'public' directory
  // app.useStaticAssets(join(__dirname, '..', 'public'), {
  //   prefix: '/',
  // });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //     transformOptions: {
  //       enableImplicitConversion: true,
  //     },
  //   }),
  // );

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
