import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappUser, WhatsappUserSchema } from './schemas/whatsapp-user.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { WhatsappApiService } from './services/whatsapp-api.service';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { WhatsappBotOrchestrator } from './orchestrators/bot.orchestrator';
import { WhatsappWebhookController } from './controllers/webhook.controller';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsappUser.name, schema: WhatsappUserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ShipmentsModule,
  ],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappApiService, AIService, ConversationService, WhatsappBotOrchestrator],
  exports: [WhatsappApiService, ConversationService, WhatsappBotOrchestrator],
})
export class WhatsappModule {
  constructor(private botOrchestrator: WhatsappBotOrchestrator) {
    console.log('🤖 Whatsapp module initialized');
  }
}
