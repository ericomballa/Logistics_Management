import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';
import { AuditActionType } from './enums/audit-action-type.enum';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLog>,
  ) {}

  async logAction(
    action: AuditActionType,
    entityType: string,
    entityId: string | null,
    performedBy: string,
    userId: string | null = null,
    details: string | null = null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditLog = await this.auditLogModel.create({
        action,
        entityType,
        entityId,
        performedBy: performedBy || 'System',
        userId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      await auditLog.save();
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error('Audit logging failed:', error);
    }
  }

  async getLogs(
    page: number = 1,
    limit: number = 20,
    filters: {
      action?: AuditActionType;
      entityType?: string;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      searchTerm?: string;
    } = {},
  ) {
    const query: any = {};

    // Apply filters
    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.dateFrom) {
      query.timestamp = { $gte: filters.dateFrom };
    }

    if (filters.dateTo) {
      query.timestamp = { ...query.timestamp, $lte: filters.dateTo };
    }

    if (filters.searchTerm) {
      query.$or = [
        { performedBy: new RegExp(filters.searchTerm, 'i') },
        { details: new RegExp(filters.searchTerm, 'i') },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const total = await this.auditLogModel.countDocuments(query).exec();

    // Get paginated results
    const logs = await this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecentLogs(limit: number = 10) {
    return this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
