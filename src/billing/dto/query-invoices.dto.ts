import { IsOptional, IsString, IsEnum, IsDateString, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';

export class QueryInvoicesDto {
  @ApiProperty({
    required: false,
    description: 'Filter by client ID',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by shipment ID',
  })
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @ApiProperty({
    enum: PaymentStatus,
    required: false,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by date from',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by date to',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({
    required: false,
    description: 'Search term for invoice number or client name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
