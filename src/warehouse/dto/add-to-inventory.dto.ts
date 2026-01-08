import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToInventoryDto {
  @ApiProperty({
    example: 'uuid-of-shipment',
    description: 'ID of the shipment to add to inventory',
  })
  @IsString()
  shipmentId: string;

  @ApiProperty({
    example: 'uuid-of-warehouse',
    description: 'ID of the warehouse where shipment will be stored',
  })
  @IsString()
  warehouseId: string;

  @ApiProperty({
    example: 'A-15-03',
    description: 'Specific location in warehouse (aisle-shelf-position)',
  })
  @IsString()
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  location: string;

  @ApiProperty({
    example: 'QR-CN-ABC12345',
    required: false,
    description: 'QR code for quick scanning',
  })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiProperty({
    example: '1234567890123',
    required: false,
    description: 'Barcode for scanning (EAN-13 or similar)',
  })
  @IsOptional()
  @IsString()
  barcode?: string;
}
