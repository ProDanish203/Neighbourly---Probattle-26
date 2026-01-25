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
import { RedisService } from 'src/common/services/redis.service';

@Controller('service-category')
@ApiTags('Service Category')
@UseGuards(AuthGuard)
export class ServiceCategoryController {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly serviceCategoryService: ServiceCategoryService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(prefix: string, ...params: (string | number | undefined)[]): string {
    const keyParts = params.filter((p) => p !== undefined && p !== null && p !== '');
    return `category:${prefix}:${keyParts.join(':')}`;
  }

  private async invalidateCategoryCache(): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys('category:*');
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get All Service Categories', description: 'Get all service categories with images populated' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @Get()
  async getAllCategories(@Query() query: QueryParams): Promise<ApiResponse<GetAllServiceCategoryResponse>> {
    const { page = 1, limit = 20 } = query || {};
    const cacheKey = this.getCacheKey('all', page, limit);

    const cached = await this.redisService.get<ApiResponse<GetAllServiceCategoryResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceCategoryService.getAllCategories(query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
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
    const response = await this.serviceCategoryService.createCategory(user, createCategoryDto, image);
    await this.invalidateCategoryCache();
    return response;
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
    const response = await this.serviceCategoryService.updateCategory(user, id, updateCategoryDto, image);
    await this.invalidateCategoryCache();
    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Delete Category', description: 'Delete a category' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @Delete(':id')
  async deleteCategory(@CurrentUser() user: User, @Param('id') id: string): Promise<ApiResponse<void>> {
    const response = await this.serviceCategoryService.deleteCategory(user, id);
    await this.invalidateCategoryCache();
    return response;
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
    const { page = 1, limit = 20 } = query || {};
    const cacheKey = this.getCacheKey('parents', page, limit);

    const cached = await this.redisService.get<ApiResponse<GetAllParentsResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceCategoryService.getAllParents(query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
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
    const { page = 1, limit = 20 } = query || {};
    const cacheKey = this.getCacheKey('parent', parentId, page, limit);

    const cached = await this.redisService.get<ApiResponse<GetByParentResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceCategoryService.getByParent(parentId, query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }
}
