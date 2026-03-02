import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from '../../users/entities/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  method: string; // CASH, BANK_TRANSFER, MOBILE_MONEY, etc.

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING, COMPLETED, FAILED, REFUNDED

  @Column({ type: 'varchar', length: 200, nullable: true })
  transactionId: string; // Reference from payment processor

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string; // Default to XAF

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference: string; // Payment reference

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  processedById: string; // User who processed the payment

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
