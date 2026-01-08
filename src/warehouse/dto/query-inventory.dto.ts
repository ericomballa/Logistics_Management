// ============================================
// src/warehouse/dto/query-inventory.dto.ts
// ============================================
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class QueryInventoryDto {
  @ApiProperty({
    required: false,
    description: 'Filter by warehouse ID',
    example: 'uuid-warehouse-id',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by shipment ID',
    example: 'uuid-shipment-id',
  })
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by whether item is still in warehouse',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isInWarehouse?: boolean;

  @ApiProperty({
    required: false,
    description: 'Filter by received date (from)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  receivedFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by received date (to)',
    example: '2025-01-31',
  })
  @IsOptional()
  @IsDateString()
  receivedTo?: string;

  @ApiProperty({
    required: false,
    description: 'Search by location (partial match)',
    example: 'A-15',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
