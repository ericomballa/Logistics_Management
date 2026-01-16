import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappApiService {
  private readonly logger = new Logger(WhatsappApiService.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('WHATSAPP_API_URL');
    this.phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
  }

  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`Message envoyé à ${to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erreur d'envoi de message: ${error.message}`);
      throw error;
    }
  }

  async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'fr'): Promise<any> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erreur d'envoi de template: ${error.message}`);
      throw error;
    }
  }

  async sendInteractiveButtons(to: string, bodyText: string, buttons: Array<{id: string, title: string}>): Promise<any> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: bodyText
            },
            action: {
              buttons: buttons.map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title
                }
              }))
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erreur d'envoi de boutons: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<any> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erreur de marquage comme lu: ${error.message}`);
    }
  }
}