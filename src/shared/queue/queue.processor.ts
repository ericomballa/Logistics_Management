import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueService, QueueMessage } from './queue.service';

@Injectable()
export class QueueProcessor implements OnModuleInit {
  constructor(private queueService: QueueService) {}

  async onModuleInit() {
    // Process tracking updates
    await this.queueService.consume(
      'tracking_updates',
      async (msg: QueueMessage) => {
        console.log('Processing tracking update:', msg.data);
        // Implement tracking update logic
      },
    );

    // Process notifications
    await this.queueService.consume(
      'notifications',
      async (msg: QueueMessage) => {
        console.log('Processing notification:', msg.data);
        // Implement notification sending logic
      },
    );

    // Process payments
    await this.queueService.consume('payments', async (msg: QueueMessage) => {
      console.log('Processing payment:', msg.data);
      // Implement payment processing logic
    });

    // Process shipment events
    await this.queueService.consume(
      'shipment_events',
      async (msg: QueueMessage) => {
        console.log('Processing shipment event:', msg.data);
        // Implement shipment event logic
      },
    );
  }
}
