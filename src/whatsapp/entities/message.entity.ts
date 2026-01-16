import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column('text')
  content: string;

  @Column({ default: 'user' })
  sender: string;

  @Column({ nullable: true })
  whatsappMessageId: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Conversation, conversation => conversation.id)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}