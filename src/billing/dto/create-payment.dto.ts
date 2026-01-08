import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'uuid-invoice-id',
    description: 'ID of the invoice being paid',
  })
  @IsString()
  invoiceId: string;

  @ApiProperty({
    example: 25000,
    description: 'Payment amount in FCFA',
  })
  @IsNumber()
  @Min(0, { message: 'Amount must be positive' })
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.MTN_MOMO,
    description: 'Payment method used',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: 'MTN-TXN-123456789',
    required: false,
    description: 'Transaction ID from payment provider',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    example: 'REF-2025-001',
    required: false,
    description: 'Internal payment reference',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    example: 'Partial payment - first installment',
    required: false,
    description: 'Additional notes about the payment',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'uuid-agent-id',
    required: false,
    description: 'ID of the agent who processed the payment',
  })
  @IsOptional()
  @IsString()
  processedBy?: string;
}
