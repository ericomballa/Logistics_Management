import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Douala Main Office' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CM-DLA' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Akwa, Douala', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Douala', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Cameroon', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '+237670000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'douala@logistics.cm', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 4.0511, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ example: 9.7679, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
