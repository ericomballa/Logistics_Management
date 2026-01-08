import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_inventory')
export class WarehouseInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipmentId: string;

  @Column()
  warehouseId: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column()
  location: string; // Shelf/Zone location

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dispatchedAt: Date;

  @Column({ default: true })
  isInWarehouse: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
