import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Query,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';
import { ShipmentNotificationDto } from './dto/shipment-notification.dto';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { DeliveryNotificationDto } from './dto/delivery-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==================== BASIC NOTIFICATIONS ====================

  @Post('send')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a single notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent' })
  async sendBulkNotification(@Body() dto: SendBulkNotificationDto) {
    return this.notificationsService.sendBulkNotification(dto);
  }

  // ==================== SHIPMENT NOTIFICATIONS ====================

  @Post('shipment-update')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send shipment status update notification' })
  @ApiResponse({ status: 201, description: 'Shipment notification sent' })
  async sendShipmentUpdate(@Body() dto: ShipmentNotificationDto) {
    return this.notificationsService.sendShipmentUpdate(
      dto.shipmentId,
      dto.trackingNumber,
      dto.status,
      dto.location,
      {
        phone: dto.recipientPhone,
        email: dto.recipientEmail,
        name: dto.recipientName,
      },
    );
  }

  @Post('delivery-ready')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send delivery ready notification' })
  @ApiResponse({ status: 201, description: 'Delivery notification sent' })
  async sendDeliveryNotification(@Body() dto: DeliveryNotificationDto) {
    return this.notificationsService.sendDeliveryNotification(
      dto.trackingNumber,
      {
        phone: dto.recipientPhone,
        email: dto.recipientEmail,
        name: dto.recipientName,
      },
      dto.warehouseAddress,
      dto.openingHours,
    );
  }

  // ==================== PAYMENT NOTIFICATIONS ====================

  @Post('payment-confirmation')
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send payment confirmation notification' })
  @ApiResponse({ status: 201, description: 'Payment notification sent' })
  async sendPaymentConfirmation(@Body() dto: PaymentNotificationDto) {
    return this.notificationsService.sendPaymentConfirmation(
      dto.invoiceNumber,
      dto.amount,
      {
        phone: dto.recipientPhone,
        email: dto.recipientEmail,
      },
      dto.paymentMethod,
    );
  }

  // ==================== TEST & MONITORING ====================

  @Post('test')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Test notification system' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async testNotification(@Body() dto: { channel: string; recipient: string }) {
    return this.notificationsService.testNotification(
      dto.channel,
      dto.recipient,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification statistics' })
  async getStats() {
    return {
      message: 'Notification statistics - implement if needed',
      note: 'Track sent notifications in a separate log table',
    };
  }
}
