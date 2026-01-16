import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('WhatsApp Integration (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/whatsapp-webhook (GET) - should verify webhook', () => {
    return request(app.getHttpServer())
      .get('/whatsapp-webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN || 'your_custom_verify_token',
        'hub.challenge': 'challenge_response'
      })
      .expect(200)
      .then(response => {
        expect(response.text).toBe('challenge_response');
      });
  });

  it('/whatsapp-webhook (POST) - should handle incoming message', () => {
    const mockWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'account-id',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+1234567890',
                  phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'phone-number-id'
                },
                contacts: [
                  {
                    profile: {
                      name: 'Test User'
                    },
                    wa_id: '1234567890'
                  }
                ],
                messages: [
                  {
                    from: '1234567890',
                    id: 'message-id',
                    timestamp: '1234567890',
                    text: {
                      body: 'Hello, I want to track my shipment AB-12345678'
                    },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    return request(app.getHttpServer())
      .post('/whatsapp-webhook')
      .send(mockWebhookPayload)
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('success');
      });
  });
});