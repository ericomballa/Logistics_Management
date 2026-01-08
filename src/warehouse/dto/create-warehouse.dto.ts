import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({
    example: 'Shanghai Main Warehouse',
    description: 'Warehouse name',
  })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name: string;

  @ApiProperty({
    example: 'CN-SHA',
    description: 'Unique warehouse code',
  })
  @IsString()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  code: string;

  @ApiProperty({
    example: 'China',
    description: 'Country where warehouse is located',
  })
  @IsString()
  country: string;

  @ApiProperty({
    example: 'Shanghai',
    description: 'City where warehouse is located',
  })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'Pudong District, 123 Logistics Avenue',
    description: 'Full warehouse address',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: '+86-21-12345678',
    required: false,
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'shanghai@logistics.com',
    required: false,
    description: 'Contact email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email?: string;

  @ApiProperty({
    example: 31.2304,
    required: false,
    description: 'Warehouse latitude for GPS tracking',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number;

  @ApiProperty({
    example: 121.4737,
    required: false,
    description: 'Warehouse longitude for GPS tracking',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number;

  @ApiProperty({
    example: 10000,
    required: false,
    description: 'Maximum storage capacity (in units)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Capacity must be positive' })
  capacity?: number;
}
