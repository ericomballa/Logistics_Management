import { Controller, Get, Query, UseGuards, HttpCode, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuditActionType } from './enums/audit-action-type.enum';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, enum: AuditActionType })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('action') action?: AuditActionType,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    const filters = {
      action,
      entityType,
      userId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      searchTerm,
    };

    return await this.auditService.getLogs(Number(page), Number(limit), filters);
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get recent audit logs' })
  @ApiResponse({ status: 200, description: 'List of recent audit logs' })
  async getRecentLogs(@Query('limit') limit: number = 10) {
    return await this.auditService.getRecentLogs(Number(limit));
  }
}
