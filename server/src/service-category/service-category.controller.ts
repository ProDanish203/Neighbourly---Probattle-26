import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User, UserRole } from '@db';
import { ApiResponse, MulterFile, QueryParams } from 'src/common/types';
import { ServiceCategoryService } from './service-category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/service-category.dto';
import { GetAllServiceCategoryResponse, GetAllParentsResponse, GetByParentResponse } from './types';
import { ServiceCategorySelect } from './queries';

@Controller('service-category')
@ApiTags('Service Category')
@UseGuards(AuthGuard)
export class ServiceCategoryController {
  constructor(private readonly serviceCategoryService: ServiceCategoryService) {}

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get All Service Categories', description: 'Get all service categories with images populated' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @Get()
  async getAllCategories(@Query() query: QueryParams): Promise<ApiResponse<GetAllServiceCategoryResponse>> {
    return await this.serviceCategoryService.getAllCategories(query);
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Create Category', description: 'Create a new category', type: CreateCategoryDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  async createCategory(
    @CurrentUser() user: User,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile('image') image?: MulterFile,
  ): Promise<ApiResponse<ServiceCategorySelect>> {
    return await this.serviceCategoryService.createCategory(user, createCategoryDto, image);
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Update Category', description: 'Update a category', type: UpdateCategoryDto })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @UseInterceptors(FileInterceptor('image'))
  @Put(':id')
  async updateCategory(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile('image') image?: MulterFile,
  ): Promise<ApiResponse<ServiceCategorySelect>> {
    return await this.serviceCategoryService.updateCategory(user, id, updateCategoryDto, image);
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Delete Category', description: 'Delete a category' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @Delete(':id')
  async deleteCategory(@CurrentUser() user: User, @Param('id') id: string): Promise<ApiResponse<void>> {
    return await this.serviceCategoryService.deleteCategory(user, id);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({
    title: 'Get All Parent Categories',
    description: 'Get all parent categories (categories without parent)',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @Get('parents')
  async getAllParents(@Query() query: QueryParams): Promise<ApiResponse<GetAllParentsResponse>> {
    return await this.serviceCategoryService.getAllParents(query);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get Categories By Parent', description: 'Get all categories by parent ID' })
  @ApiParam({ name: 'parentId', type: String, description: 'Parent Category ID' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @Get('parent/:parentId')
  async getByParent(
    @Param('parentId') parentId: string,
    @Query() query: QueryParams,
  ): Promise<ApiResponse<GetByParentResponse>> {
    return await this.serviceCategoryService.getByParent(parentId, query);
  }
}
