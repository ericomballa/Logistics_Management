import { IsString, IsNumber, IsPositive, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTariffDto {
  @ApiProperty({
    example: 'CHINA',
    description: 'Origin country/region',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    example: 'CAMEROON',
    description: 'Destination country/region',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    example: 5000,
    description: 'Base price for first kg (in FCFA)',
  })
  @IsNumber()
  @IsPositive()
  basePrice: number;

  @ApiProperty({
    example: 2000,
    description: 'Additional price per kg (in FCFA)',
  })
  @IsNumber()
  @IsPositive()
  pricePerKg: number;

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
  isActive?: boolean = true;
}