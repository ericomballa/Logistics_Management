import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeliveryNotificationDto {
  @ApiProperty({
    example: 'CN-ABC12345',
    description: 'Tracking number',
  })
  @IsString()
  trackingNumber: string;

  @ApiProperty({
    example: 'Akwa, Douala - Entrepôt Principal',
    description: 'Pickup location address',
  })
  @IsString()
  warehouseAddress: string;

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
    example: 'Jane Smith',
    description: 'Recipient name',
  })
  @IsString()
  recipientName: string;

  @ApiProperty({
    example: 'Lundi - Vendredi: 8h - 17h',
    required: false,
    description: 'Warehouse opening hours',
  })
  @IsOptional()
  @IsString()
  openingHours?: string;
}
