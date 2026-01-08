import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @ApiProperty({
    example: 'user@logistics.cm',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({
    example: 'SecurePass@123',
    description:
      'Strong password (min 6 chars, must contain letter and number)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({
    example: '+237670000000',
    required: false,
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.CLIENT,
    description: 'User role in the system',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: 'uuid-here',
    required: false,
    description: 'Agency ID (required for agents and admins)',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;
}
