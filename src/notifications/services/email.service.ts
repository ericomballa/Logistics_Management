import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly apiKey = process.env.EMAIL_API_KEY;

  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
  }): Promise<any> {
    try {
      console.log(`Email to ${data.to}: ${data.subject}`);

      // For production, implement actual email service (e.g., SendGrid, Mailgun)
      // const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
      //   personalizations: [{ to: [{ email: data.to }] }],
      //   from: { email: 'noreply@logistics.com' },
      //   subject: data.subject,
      //   content: [{ type: 'text/plain', value: data.body }],
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      return { success: true, to: data.to };
    } catch (error) {
      console.error('Email Error:', error);
      throw error;
    }
  }
}
