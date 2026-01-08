import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly apiKey = process.env.SMS_API_KEY;

  async sendSms(phone: string, message: string): Promise<any> {
    try {
      // Example using a generic SMS gateway
      // Replace with your actual SMS provider (e.g., Twilio, AfricasTalking)
      console.log(`SMS to ${phone}: ${message}`);

      // For production, implement actual SMS gateway
      // const response = await axios.post('https://sms-api.example.com/send', {
      //   to: phone,
      //   message: message,
      //   apiKey: this.apiKey,
      // });

      return { success: true, phone, message };
    } catch (error) {
      console.error('SMS Error:', error);
      throw error;
    }
  }
}
