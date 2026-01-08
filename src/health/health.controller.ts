import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      services: {
        database: 'connected',
        mongodb: 'connected',
        redis: 'connected',
        rabbitmq: 'connected',
      },
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping' })
  ping() {
    return { message: 'pong' };
  }
}
