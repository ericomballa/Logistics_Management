import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tariffs')
export class Tariff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  origin: string;

  @Column({ type: 'varchar', length: 100 })
  destination: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number; // Price for first kg

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerKg: number; // Additional price per kg

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minWeight: number; // Minimum weight for this tariff

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxWeight: number; // Maximum weight for this tariff

  @Column({ type: 'varchar', length: 200, nullable: true })
  serviceType: string; // Standard, Express, etc.

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}