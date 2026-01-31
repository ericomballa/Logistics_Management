import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WhatsappUser } from './whatsapp-user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('jsonb', { default: {} })
  context: any;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  currentStep: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => WhatsappUser, user => user.conversations)
  @JoinColumn({ name: 'userId' })
  user: WhatsappUser;
}