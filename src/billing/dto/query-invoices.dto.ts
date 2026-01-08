import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
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
}
