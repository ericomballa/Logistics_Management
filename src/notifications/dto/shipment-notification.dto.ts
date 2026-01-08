// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShipmentNotificationDto {
  @ApiProperty({
    example: 'uuid-shipment-id',
    description: 'Shipment ID',
  })
  @IsString()
  shipmentId: string;

  @ApiProperty({
    example: 'CN-ABC12345',
    description: 'Tracking number',
  })
  @IsString()
  trackingNumber: string;

  @ApiProperty({
    example: 'IN_TRANSIT',
    description: 'New shipment status',
  })
  @IsString()
  status: string;

  @ApiProperty({
    example: 'Dubai Hub',
    description: 'Current location',
  })
  @IsString()
  location: string;

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
}
