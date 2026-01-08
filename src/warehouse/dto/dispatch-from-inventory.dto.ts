import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DispatchFromInventoryDto {
  @ApiProperty({
    example: 'uuid-of-inventory-item',
    description: 'ID of the inventory item to dispatch',
  })
  @IsString()
  inventoryId: string;

  @ApiProperty({
    example: 'Dispatched for delivery to Douala',
    required: false,
    description: 'Notes about the dispatch',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'uuid-of-agent',
    required: false,
    description: 'Agent who processed the dispatch',
  })
  @IsOptional()
  @IsString()
  dispatchedBy?: string;
}
