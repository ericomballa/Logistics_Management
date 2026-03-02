import { IsString, IsNumber, IsPositive, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTariffDto } from './create-tariff.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTariffDto extends PartialType(CreateTariffDto) {
  @ApiProperty({
    example: 'CHINA',
    description: 'Origin country/region',
    required: false,
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({
    example: 'CAMEROON',
    description: 'Destination country/region',
    required: false,
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({
    example: 5000,
    description: 'Base price for first kg (in FCFA)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  basePrice?: number;

  @ApiProperty({
    example: 2000,
    description: 'Additional price per kg (in FCFA)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerKg?: number;

  @ApiProperty({
    example: 0.5,
    required: false,
    description: 'Minimum weight threshold (kg)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minWeight?: number;

  @ApiProperty({
    example: 50,
    required: false,
    description: 'Maximum weight threshold (kg)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxWeight?: number;

  @ApiProperty({
    example: 'STANDARD',
    required: false,
    description: 'Service type',
  })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether tariff is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}