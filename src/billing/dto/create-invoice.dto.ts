import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({
    example: 'uuid-shipment-id',
    description: 'ID of the shipment for this invoice',
  })
  @IsString()
  shipmentId: string;

  @ApiProperty({
    example: 'uuid-client-id',
    description: 'ID of the client to bill',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    example: 50000,
    description: 'Subtotal amount before tax and discount (in FCFA)',
  })
  @IsNumber()
  @Min(0, { message: 'Subtotal must be positive' })
  subtotal: number;

  @ApiProperty({
    example: 9500,
    required: false,
    description: 'Tax amount (VAT) in FCFA',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Discount amount in FCFA',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({
    example: 54500,
    description: 'Total amount to pay (subtotal + tax - discount) in FCFA',
  })
  @IsNumber()
  @Min(0, { message: 'Total must be positive' })
  total: number;

  @ApiProperty({
    example: '2025-02-15',
    required: false,
    description: 'Due date for payment',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
