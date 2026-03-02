import { IsString, IsNumber, IsPositive, IsEnum, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class CreatePaymentDto {
  @ApiProperty({
    example: 50000,
    description: 'Amount of the payment (in FCFA)',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'CASH',
    enum: PaymentMethod,
    description: 'Payment method used',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: 'COMPLETED',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
    description: 'Status of the payment',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus = PaymentStatus.COMPLETED;

  @ApiProperty({
    example: 'Transaction123',
    required: false,
    description: 'External transaction ID from payment processor',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    example: 'Paiement pour la facture #INV-001',
    required: false,
    description: 'Notes about the payment',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'INV-001',
    description: 'Invoice ID this payment is for',
  })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    example: 'XAF',
    default: 'XAF',
    description: 'Currency of the payment',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'XAF';

  @ApiProperty({
    example: 'PAY-REF-001',
    required: false,
    description: 'Payment reference',
  })
  @IsOptional()
  @IsString()
  reference?: string;
}