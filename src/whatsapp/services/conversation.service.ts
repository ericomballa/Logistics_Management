import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsappUser } from '../schemas/whatsapp-user.schema';
import { Conversation } from '../schemas/conversation.schema';
import { Message } from '../schemas/message.schema';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectModel(WhatsappUser.name)
    private userModel: Model<WhatsappUser>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
  ) {}

  async getOrCreateUser(phoneNumber: string, name?: string): Promise<WhatsappUser> {
    let user = await this.userModel.findOne({ phoneNumber }).exec();

    if (!user) {
      user = await this.userModel.create({
        phoneNumber,
        name: name || 'Utilisateur',
      });
      await user.save();
      this.logger.log(`Nouvel utilisateur créé: ${phoneNumber}`);
    } else if (name && !user.name) {
      user.name = name;
      await user.save();
    }

    return user;
  }

  async getActiveConversation(userId: string): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({
      userId,
      status: 'active',
    }).exec();

    if (!conversation) {
      conversation = await this.conversationModel.create({
        userId,
        status: 'active',
        context: {},
        currentStep: 'greeting',
      });
      await conversation.save();
    }

    return conversation;
  }

  async updateConversationContext(conversationId: string, context: any): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { context },
    }).exec();
  }

  async updateConversationStep(conversationId: string, step: string): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { currentStep: step },
    }).exec();
  }

  async saveMessage(
    conversationId: string,
    content: string,
    sender: 'user' | 'bot',
    whatsappMessageId?: string,
  ): Promise<Message> {
    const message = await this.messageModel.create({
      conversationId,
      content,
      sender,
      whatsappMessageId,
    });
    return message.save();
  }

  async getConversationHistory(conversationId: string, limit: number = 10): Promise<Message[]> {
    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
