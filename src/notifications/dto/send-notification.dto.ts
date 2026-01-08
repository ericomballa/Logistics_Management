import {
  IsString,
  IsEnum,
  IsOptional,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    example: '+237670123456',
    description: 'Recipient phone number or email',
  })
  @IsString()
  @MinLength(5, { message: 'Recipient must be at least 5 characters' })
  recipient: string;

  @ApiProperty({
    example: 'Votre colis CN-ABC12345 est arrivé à Dubaï',
    description: 'Notification message content',
  })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  message: string;

  @ApiProperty({
    enum: ['whatsapp', 'sms', 'email'],
    example: 'whatsapp',
    description: 'Notification channel',
  })
  @IsEnum(['whatsapp', 'sms', 'email'], {
    message: 'Channel must be whatsapp, sms, or email',
  })
  channel: string;

  @ApiProperty({
    example: 'Mise à jour de votre colis',
    required: false,
    description: 'Subject line (used for email)',
  })
  @IsOptional()
  @IsString()
  subject?: string;
}
