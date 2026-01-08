import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OriginCountry } from '../enums/origin-country.enum';
import { DestinationCountry } from '../enums/destination-country.enum';

export class CreateShipmentDto {
  @ApiProperty()
  @IsString()
  senderName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiProperty()
  @IsString()
  receiverName: string;

  @ApiProperty()
  @IsString()
  receiverPhone: string;

  @ApiProperty()
  @IsString()
  receiverAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverCity?: string;

  @ApiProperty({ enum: OriginCountry })
  @IsEnum(OriginCountry)
  origin: OriginCountry;

  @ApiProperty({ enum: DestinationCountry })
  @IsEnum(DestinationCountry)
  destination: DestinationCountry;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weight: number;

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
