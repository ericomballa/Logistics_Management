import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTariffRuleDto {
  @ApiProperty({
    example: 'China to Cameroon Standard',
    description: 'Tariff rule name',
  })
  @IsString()
  name: string;

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
    example: 5000,
    description: 'Base rate (fixed charge) in FCFA',
  })
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty({
    example: 1500,
    description: 'Rate per kilogram in FCFA',
  })
  @IsNumber()
  @Min(0)
  ratePerKg: number;

  @ApiProperty({
    example: 8000,
    required: false,
    description: 'Rate per cubic meter in FCFA',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerCbm?: number;

  @ApiProperty({
    example: 2.5,
    required: false,
    description: 'Insurance rate (percentage of declared value)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  // @Max(100)
  insuranceRate?: number;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether this tariff rule is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
// function Max(
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   arg0: number,
// ): (target: CreateTariffRuleDto, propertyKey: 'insuranceRate') => void {
//   throw new Error('Function not implemented.');
// }
