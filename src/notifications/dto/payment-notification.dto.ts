import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentNotificationDto {
  @ApiProperty({
    example: 'INV-202501-0001',
    description: 'Invoice number',
  })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({
    example: 25000,
    description: 'Payment amount in FCFA',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 'MTN_MOMO',
    description: 'Payment method',
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    example: '+237670123456',
    description: 'Recipient phone number',
  })
  @IsString()
  recipientPhone: string;

  @ApiProperty({
    example: 'client@example.com',
    required: false,
    description: 'Recipient email',
  })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Recipient name',
  })
  @IsString()
  recipientName: string;
}
