import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateCostDto {
  @ApiProperty({
    example: 'CHINA',
    description: 'Origin country',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    example: 'CAMEROON',
    description: 'Destination country',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    example: 5.5,
    description: 'Weight in kilograms',
  })
  @IsNumber()
  @Min(0, { message: 'Weight must be positive' })
  weight: number;

  @ApiProperty({
    example: 0.25,
    required: false,
    description: 'Volume in cubic meters',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({
    example: 100000,
    required: false,
    description: 'Declared value for insurance calculation (in FCFA)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declaredValue?: number;
}
