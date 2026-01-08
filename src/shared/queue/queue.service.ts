import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Options } from 'amqplib';
export interface QueueMessage {
  type: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  options: Options.Publish = {
    persistent: true,
  };

  private readonly QUEUES = {
    TRACKING_UPDATES: 'tracking_updates',
    NOTIFICATIONS: 'notifications',
    PAYMENTS: 'payments',
    SHIPMENT_EVENTS: 'shipment_events',
  };

  async onModuleInit() {
    try {
      this.connection = amqp.connect([
        process.env.RABBITMQ_URL || 'amqp://localhost',
      ]);

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel) => {
          // Create all queues
          await Promise.all(
            Object.values(this.QUEUES).map((queue) =>
              channel.assertQueue(queue, { durable: true }),
            ),
          );
        },
      });

      await this.channelWrapper.waitForConnect();
      console.log('✅ RabbitMQ connected');
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
    await this.connection.close();
  }

  async publishTrackingUpdate(data: any): Promise<void> {
    const message: QueueMessage = {
      type: 'TRACKING_UPDATE',
      data,
      timestamp: new Date(),
    };

    await this.channelWrapper.sendToQueue(
      this.QUEUES.TRACKING_UPDATES,
      message,
      this.options,
    );
  }

  async publishNotification(data: any): Promise<void> {
    const message: QueueMessage = {
      type: 'NOTIFICATION',
      data,
      timestamp: new Date(),
    };

    await this.channelWrapper.sendToQueue(
      this.QUEUES.NOTIFICATIONS,
      message,
      this.options,
    );
  }

  async publishPaymentEvent(data: any): Promise<void> {
    const message: QueueMessage = {
      type: 'PAYMENT',
      data,
      timestamp: new Date(),
    };

    await this.channelWrapper.sendToQueue(
      this.QUEUES.PAYMENTS,
      message,
      this.options,
    );
  }

  async publishShipmentEvent(data: any): Promise<void> {
    const message: QueueMessage = {
      type: 'SHIPMENT_EVENT',
      data,
      timestamp: new Date(),
    };

    await this.channelWrapper.sendToQueue(
      this.QUEUES.SHIPMENT_EVENTS,
      message,
      this.options,
    );
  }

  async consume(
    queueName: string,
    callback: (msg: QueueMessage) => Promise<void>,
  ): Promise<void> {
    await this.channelWrapper.addSetup(async (channel) => {
      await channel.consume(queueName, async (message) => {
        if (message) {
          try {
            const content: QueueMessage = JSON.parse(
              message.content.toString(),
            );
            await callback(content);
            channel.ack(message);
          } catch (error) {
            console.error('Error processing message:', error);
            channel.nack(message, false, false);
          }
        }
      });
    });
  }
}
