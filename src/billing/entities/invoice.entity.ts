import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Payment } from './payment.entity';
// Avoid circular imports by using string names for relations or simple any for now if imports fail
// import { Shipment } from '../../shipments/entities/shipment.entity';
// import { User } from '../../users/entities/user.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  shipmentId: string;

  @ManyToOne('Shipment')
  @JoinColumn({ name: 'shipmentId' })
  shipment: any;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'clientId' })
  client: any;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'createdById' })
  createdBy: any;

  @UpdateDateColumn()
  updatedAt: Date;
}
