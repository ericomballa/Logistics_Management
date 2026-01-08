import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RecipientDto {
  @ApiProperty({ example: '+237670123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'client@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;
}

export class SendBulkNotificationDto {
  @ApiProperty({
    type: [RecipientDto],
    description: 'List of recipients',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];

  @ApiProperty({
    example: 'Promotion spéciale sur les envois!',
    description: 'Notification message',
  })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiProperty({
    enum: ['whatsapp', 'sms', 'email'],
    example: 'whatsapp',
  })
  @IsEnum(['whatsapp', 'sms', 'email'])
  channel: string;

  @ApiProperty({
    example: 'Promotion spéciale',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;
}
