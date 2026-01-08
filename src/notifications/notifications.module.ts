import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';

@Module({
  providers: [NotificationsService, WhatsAppService, SmsService, EmailService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
