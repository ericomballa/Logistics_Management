import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappUser } from '../entities/whatsapp-user.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(WhatsappUser)
    private userRepository: Repository<WhatsappUser>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async getOrCreateUser(phoneNumber: string, name?: string): Promise<WhatsappUser> {
    let user = await this.userRepository.findOne({ where: { phoneNumber } });

    if (!user) {
      user = this.userRepository.create({
        phoneNumber,
        name: name || 'Utilisateur',
      });
      await this.userRepository.save(user);
      this.logger.log(`Nouvel utilisateur créé: ${phoneNumber}`);
    } else if (name && !user.name) {
      user.name = name;
      await this.userRepository.save(user);
    }

    return user;
  }

  async getActiveConversation(userId: string): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      where: { userId, status: 'active' },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        userId,
        status: 'active',
        context: {},
        currentStep: 'greeting',
      });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async updateConversationContext(conversationId: string, context: any): Promise<void> {
    await this.conversationRepository.update(conversationId, { context });
  }

  async updateConversationStep(conversationId: string, step: string): Promise<void> {
    await this.conversationRepository.update(conversationId, { currentStep: step });
  }

  async saveMessage(
    conversationId: string,
    content: string,
    sender: 'user' | 'bot',
    whatsappMessageId?: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      content,
      sender,
      whatsappMessageId,
    });
    return await this.messageRepository.save(message);
  }

  async getConversationHistory(conversationId: string, limit: number = 10): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
