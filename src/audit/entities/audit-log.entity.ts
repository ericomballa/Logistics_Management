import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { AuditActionType } from '../enums/audit-action-type.enum';

@Entity('audit_logs')
@Index(['action', 'entityType', 'timestamp']) // Index for common queries
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: AuditActionType;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({ type: 'varchar', length: 200 })
  performedBy: string; // User's name or email

  @Column({ type: 'varchar', length: 50, nullable: true })
  userId: string; // User ID if available

  @Column({ type: 'varchar', length: 200, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;
}