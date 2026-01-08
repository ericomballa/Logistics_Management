import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly apiKey = process.env.WHATSAPP_API_KEY;

  async sendMessage(phone: string, message: string): Promise<any> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        'WhatsApp API Error:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async sendTemplate(
    phone: string,
    templateName: string,
    parameters: any[],
  ): Promise<any> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'fr' },
            components: [
              {
                type: 'body',
                parameters,
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        'WhatsApp Template Error:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if missing (Cameroon: 237)
    if (!cleaned.startsWith('237') && cleaned.length === 9) {
      cleaned = '237' + cleaned;
    }

    return cleaned;
  }
}
