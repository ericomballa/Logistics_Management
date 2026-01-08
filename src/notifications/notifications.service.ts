import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from './services/whatsapp.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private whatsappService: WhatsAppService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  // ==================== GENERIC NOTIFICATION ====================

  async sendNotification(dto: SendNotificationDto) {
    try {
      switch (dto.channel) {
        case 'whatsapp':
          await this.whatsappService.sendMessage(dto.recipient, dto.message);
          break;
        case 'sms':
          await this.smsService.sendSms(dto.recipient, dto.message);
          break;
        case 'email':
          if (!dto.subject) {
            throw new BadRequestException(
              'Subject is required for email notifications',
            );
          }
          await this.emailService.sendEmail({
            to: dto.recipient,
            subject: dto.subject,
            body: dto.message,
          });
          break;
        default:
          throw new BadRequestException(`Unsupported channel: ${dto.channel}`);
      }

      return {
        success: true,
        message: `Notification sent via ${dto.channel}`,
        recipient: dto.recipient,
      };
    } catch (error) {
      console.error(`Failed to send notification via ${dto.channel}:`, error);
      return {
        success: false,
        message: `Failed to send notification: ${error.message}`,
        recipient: dto.recipient,
      };
    }
  }

  // ==================== BULK NOTIFICATIONS ====================

  async sendBulkNotification(dto: SendBulkNotificationDto) {
    const results = [];

    for (const recipient of dto.recipients) {
      try {
        const recipientAddress =
          dto.channel === 'email' ? recipient.email : recipient.phone;

        if (!recipientAddress) {
          results.push({
            recipient: recipient.name,
            success: false,
            error: `No ${dto.channel} address provided`,
          });
          continue;
        }

        await this.sendNotification({
          recipient: recipientAddress,
          message: dto.message,
          channel: dto.channel,
          subject: dto.subject,
        });

        results.push({
          recipient: recipient.name,
          success: true,
        });
      } catch (error) {
        results.push({
          recipient: recipient.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      total: dto.recipients.length,
      success: successCount,
      failed: failureCount,
      results,
    };
  }

  // ==================== SHIPMENT NOTIFICATIONS ====================

  async sendShipmentUpdate(
    shipmentId: string,
    trackingNumber: string,
    status: string,
    location: string,
    recipient: { phone: string; email?: string; name: string },
  ) {
    const message = this.buildShipmentUpdateMessage(
      trackingNumber,
      status,
      location,
    );

    // Send WhatsApp (priority in Africa)
    if (recipient.phone) {
      try {
        await this.whatsappService.sendMessage(recipient.phone, message);
      } catch (error) {
        console.error('WhatsApp send failed:', error);
        // Fallback to SMS
        try {
          await this.smsService.sendSms(recipient.phone, message);
        } catch (smsError) {
          console.error('SMS fallback failed:', smsError);
        }
      }
    }

    // Send Email
    if (recipient.email) {
      try {
        await this.emailService.sendEmail({
          to: recipient.email,
          subject: `Mise à jour: Colis ${trackingNumber}`,
          body: message,
        });
      } catch (error) {
        console.error('Email send failed:', error);
      }
    }

    return {
      success: true,
      message: 'Shipment update notifications sent',
      trackingNumber,
    };
  }

  async sendDeliveryNotification(
    trackingNumber: string,
    recipient: { phone: string; email?: string; name: string },
    warehouseAddress: string,
    openingHours?: string,
  ) {
    const message = `
🎉 Bonjour ${recipient.name}!

Votre colis ${trackingNumber} est arrivé et prêt pour le retrait!

📍 Adresse: ${warehouseAddress}
${openingHours ? `🕒 Horaires: ${openingHours}` : ''}

Merci de votre confiance! 🚚
    `.trim();

    if (recipient.phone) {
      try {
        await this.whatsappService.sendMessage(recipient.phone, message);
      } catch (error) {
        console.error('WhatsApp delivery notification failed:', error);
        await this.smsService.sendSms(recipient.phone, message);
      }
    }

    if (recipient.email) {
      await this.emailService.sendEmail({
        to: recipient.email,
        subject: `🎉 Votre colis ${trackingNumber} est prêt!`,
        body: message,
      });
    }

    return {
      success: true,
      message: 'Delivery notification sent',
      trackingNumber,
    };
  }

  // ==================== PAYMENT NOTIFICATIONS ====================

  async sendPaymentConfirmation(
    invoiceNumber: string,
    amount: number,
    recipient: { phone: string; email?: string },
    paymentMethod?: string,
  ) {
    const message = `
✅ Paiement confirmé!

Facture: ${invoiceNumber}
Montant: ${amount.toLocaleString()} FCFA
${paymentMethod ? `Méthode: ${paymentMethod}` : ''}

Merci pour votre paiement! 💰
    `.trim();

    if (recipient.phone) {
      try {
        await this.whatsappService.sendMessage(recipient.phone, message);
      } catch (error) {
        console.error('WhatsApp payment notification failed:', error);
        await this.smsService.sendSms(recipient.phone, message);
      }
    }

    if (recipient.email) {
      await this.emailService.sendEmail({
        to: recipient.email,
        subject: `Confirmation de paiement - ${invoiceNumber}`,
        body: message,
      });
    }

    return {
      success: true,
      message: 'Payment confirmation sent',
      invoiceNumber,
    };
  }

  // ==================== HELPER METHODS ====================

  private buildShipmentUpdateMessage(
    trackingNumber: string,
    status: string,
    location: string,
  ): string {
    const statusMessages = {
      PENDING: '📦 Votre colis a été enregistré',
      RECEIVED_ORIGIN: "✅ Reçu à l'entrepôt d'origine",
      IN_TRANSIT: '🚢 En transit',
      ARRIVED_HUB: '🛬 Arrivé au hub',
      IN_WAREHOUSE: '🏭 En entrepôt',
      CUSTOMS_CLEARANCE: '📋 En dédouanement',
      OUT_FOR_DELIVERY: '🚚 En cours de livraison',
      DELIVERED: '🎉 Livré',
      CANCELLED: '❌ Annulé',
      RETURNED: '↩️ Retourné',
    };

    const statusEmoji = statusMessages[status] || status;

    return `
${statusEmoji}

Colis: ${trackingNumber}
📍 Localisation: ${location}
🕒 ${new Date().toLocaleDateString('fr-FR')}

Suivez votre colis en temps réel! 🌍
    `.trim();
  }

  // ==================== TEST NOTIFICATION ====================

  async testNotification(channel: string, recipient: string) {
    const testMessage = `
🧪 Test de notification

Ceci est un message de test du système de notifications.
Date: ${new Date().toLocaleString('fr-FR')}

Si vous recevez ce message, le système fonctionne correctement! ✅
    `.trim();

    try {
      await this.sendNotification({
        recipient,
        message: testMessage,
        channel,
        subject: 'Test de notification',
      });

      return {
        success: true,
        message: `Test notification sent via ${channel}`,
        recipient,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Test notification failed: ${error.message}`,
        recipient,
        timestamp: new Date(),
      };
    }
  }
}
