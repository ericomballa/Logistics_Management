import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShipmentStatus } from '../enums/shipment-status.enum';
import { OriginCountry } from '../enums/origin-country.enum';
import { DestinationCountry } from '../enums/destination-country.enum';
import { User } from '../../users/entities/user.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  // Sender
  @Column()
  senderName: string;

  @Column({ nullable: true })
  senderPhone: string;

  @Column({ nullable: true })
  senderEmail: string;

  @Column({ nullable: true })
  senderAddress: string;

  // Receiver
  @Column()
  receiverName: string;

  @Column()
  receiverPhone: string;

  @Column({ nullable: true })
  receiverEmail: string;

  @Column()
  receiverAddress: string;

  @Column({ nullable: true })
  receiverCity: string;

  // Origin & Destination
  @Column({ type: 'enum', enum: OriginCountry })
  origin: OriginCountry;

  @Column({ type: 'enum', enum: DestinationCountry })
  destination: DestinationCountry;

  // Shipment details
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  volume: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declaredValue: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  numberOfPackages: number;

  // Status & Tracking
  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ nullable: true })
  currentLocation: string;

  @Column({ nullable: true })
  warehouseId: string;

  // Client & Agent
  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  agentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  // Dates
  @Column({ nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ nullable: true })
  actualDeliveryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
