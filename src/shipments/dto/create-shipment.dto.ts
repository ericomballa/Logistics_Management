import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OriginCountry } from '../enums/origin-country.enum';
import { DestinationCountry } from '../enums/destination-country.enum';

export class CreateShipmentDto {
  constructor() {
    console.log('CreateShipmentDto initialized, OriginCountry:', OriginCountry);
    console.log('DestinationCountry enum:', DestinationCountry);
  }

  @ApiProperty()
  @IsString()
  senderName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiProperty({ required: false, description: 'ID of the client (if different from creator)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverName?: string; // Payload uses recipientName

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverAddress?: string; // Payload uses recipientAddress

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  originCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  destinationCity?: string;

  // Payload fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recipientAddress?: string;

  @ApiProperty({ enum: OriginCountry, required: false })
  @IsOptional()
  @IsEnum(OriginCountry)
  origin?: any;

  @ApiProperty({ enum: DestinationCountry, required: false })
  @IsOptional()
  @IsEnum(DestinationCountry)
  destination?: any;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  estimatedDeliveryDate?: string | Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  volume?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  declaredValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  numberOfPackages?: number;
}
