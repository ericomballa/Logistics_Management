import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== USER ENDPOINTS ====================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('role') role?: UserRole,
    @Query('agencyId') agencyId?: string,
    @Query('isActive') isActive?: string, // toujours string ici
  ) {
    let isActiveBool: boolean | undefined;

    if (isActive !== undefined) {
      isActiveBool = isActive.toLowerCase() === 'true';
    }

    return this.usersService.findAll({
      role,
      agencyId,
      isActive: isActiveBool, // <-- passer le boolean au service
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    // Users can update themselves, admins can update others
    if (
      currentUser.userId !== id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate user' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // ==================== AGENCY ENDPOINTS ====================

  @Post('agencies')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new agency' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  createAgency(@Body() createAgencyDto: CreateAgencyDto) {
    return this.usersService.createAgency(createAgencyDto);
  }

  @Get('all/agencies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all agencies' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'country', required: false })
  findAllAgencies(@Query('isActive') isActive?: string, @Query('country') country?: string) {
    let isActiveBool: boolean | undefined;

    if (isActive !== undefined) {
      isActiveBool = isActive.toLowerCase() === 'true';
    }

    return this.usersService.findAllAgencies({
      isActive: isActiveBool,
      country,
    });
  }

  @Get('agencies/:id')
  @ApiOperation({ summary: 'Get agency by ID' })
  findAgency(@Param('id') id: string) {
    return this.usersService.findAgency(id);
  }

  @Get('agencies/:id/stats')
  @ApiOperation({ summary: 'Get agency statistics' })
  getAgencyStats(@Param('id') id: string) {
    return this.usersService.getAgencyStats(id);
  }

  @Patch('agencies/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update agency' })
  updateAgency(@Param('id') id: string, @Body() updateAgencyDto: UpdateAgencyDto) {
    return this.usersService.updateAgency(id, updateAgencyDto);
  }

  @Delete('agencies/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete agency' })
  removeAgency(@Param('id') id: string) {
    return this.usersService.removeAgency(id);
  }
}
