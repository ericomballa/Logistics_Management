import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrackingEventDto {
  @ApiProperty()
  @IsString()
  shipmentId: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ enum: ['SYSTEM', 'AGENT', 'CLIENT'] })
  @IsEnum(['SYSTEM', 'AGENT', 'CLIENT'])
  actor: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actorId?: string;
}
