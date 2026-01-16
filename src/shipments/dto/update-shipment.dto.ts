import { PartialType } from '@nestjs/swagger';
import { CreateShipmentDto } from './create-shipment.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShipmentStatus } from '../enums/shipment-status.enum';

export class UpdateShipmentDto extends PartialType(CreateShipmentDto) {
  @ApiProperty({ enum: ShipmentStatus, required: false })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentLocation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentLocationCountry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warehouseId?: string;
}
