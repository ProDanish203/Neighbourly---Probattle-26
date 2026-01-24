import { Body, Controller, Get, Param, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserService } from './user.service';
import { User, UserRole } from '@db';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { QueryParams, MulterFile, ApiResponse } from 'src/common/types';
import { UpdateUserDto } from './dto/user.dto';
import { UserSelect } from './queries';
import { GetAllUserResponse, CompleteUserProfileResponse } from './types';

@Controller('user')
@ApiTags('User')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get All Users', description: 'Get all users by role' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @ApiQuery({ name: 'filter', type: String, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiParam({ name: 'role', type: String, enum: UserRole, required: true })
  @Get('all/:role')
  async getAllUsers(
    @CurrentUser() user: User,
    @Param('role') role: UserRole,
    @Query() query: QueryParams,
  ): Promise<ApiResponse<GetAllUserResponse>> {
    return await this.userService.getAllUsersByRole(user, role, query);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get Current User', description: 'Get current authenticated user' })
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User): Promise<ApiResponse<UserSelect>> {
    return this.userService.getCurrentUser(user);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Update User', description: 'Update user profile information', type: UpdateUserDto })
  @Put('me')
  async updateUser(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponse<UserSelect>> {
    return await this.userService.updateUser(user, updateUserDto);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Update Avatar', description: 'Update user avatar image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @Put('me/avatar')
  async updateAvatar(
    @CurrentUser() user: User,
    @UploadedFile() avatar: MulterFile,
  ): Promise<ApiResponse<UserSelect>> {
    return await this.userService.updateAvatar(user, avatar);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({
    title: 'Get Complete User Profile',
    description: 'Get complete user profile with userProfile information by user ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @Get('profile/:id')
  async getCompleteUserProfile(@Param('id') id: string): Promise<ApiResponse<CompleteUserProfileResponse>> {
    return await this.userService.getCompleteUserProfile(id);
  }
}
