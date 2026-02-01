import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('shipments/by-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get shipments grouped by status' })
  getShipmentsByStatus() {
    return this.reportsService.getShipmentsByStatus();
  }

  @Get('shipments/by-origin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get shipments grouped by origin' })
  getShipmentsByOrigin() {
    return this.reportsService.getShipmentsByOrigin();
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get revenue report' })
  getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getRevenueByPeriod(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('delivery-time')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get average delivery time' })
  getAverageDeliveryTime() {
    return this.reportsService.getAverageDeliveryTime();
  }

  @Get('revenue/daily')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SECRETARY)
  @ApiOperation({ summary: 'Get daily revenue report' })
  getDailyRevenue(
    @Query('date') date: string,
  ) {
    return this.reportsService.getDailyRevenue(new Date(date));
  }
}
