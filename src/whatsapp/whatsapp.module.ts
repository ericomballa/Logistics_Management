import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappUser } from './entities/whatsapp-user.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { WhatsappApiService } from './services/whatsapp-api.service';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { WhatsappBotOrchestrator } from './orchestrators/bot.orchestrator';
import { WhatsappWebhookController } from './controllers/webhook.controller';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappUser, Conversation, Message, User]),
    ShipmentsModule,
  ],
  controllers: [WhatsappWebhookController],
  providers: [
    WhatsappApiService,
    AIService,
    ConversationService,
    WhatsappBotOrchestrator,
  ],
  exports: [
    WhatsappApiService,
    ConversationService,
    WhatsappBotOrchestrator,
  ],
})
export class WhatsappModule {}