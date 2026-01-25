import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User, UserRole } from '@db';
import { ApiResponse, MulterFile, QueryParams } from 'src/common/types';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { GetMyServicesResponse, GetNearbyServicesResponse, GetServiceByIdResponse, ServiceQueryParams } from './types';
import { ServiceSelect } from './queries';
import { RedisService } from 'src/common/services/redis.service';

@Controller('service')
@ApiTags('Service')
@UseGuards(AuthGuard)
export class ServiceController {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly serviceService: ServiceService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(prefix: string, ...params: (string | number | undefined)[]): string {
    const keyParts = params.filter((p) => p !== undefined && p !== null && p !== '');
    return `service:${prefix}:${keyParts.join(':')}`;
  }

  private async invalidateServiceCache(): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys('service:*');
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({
    title: 'Get Nearby Services',
    description: 'Get nearby services with filtering by category and price',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'categoryId', type: String, required: false })
  @ApiQuery({ name: 'price', type: Number, required: false })
  @ApiQuery({ name: 'minPrice', type: Number, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false })
  @ApiQuery({ name: 'filter', type: String, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @Get('nearby')
  async getNearbyServices(
    @CurrentUser() user: User,
    @Query() query: ServiceQueryParams,
  ): Promise<ApiResponse<GetNearbyServicesResponse>> {
    const {
      page = 1,
      limit = 20,
      search = '',
      categoryId,
      minPrice,
      maxPrice,
      radius,
    } = query || {};

    // Note: Cache key includes user.id, but actual location is fetched in service
    // This means cache might be less precise, but avoids accessing prismaService in controller
    const cacheKey = this.getCacheKey(
      'nearby',
      user.id,
      page,
      limit,
      search,
      categoryId,
      minPrice,
      maxPrice,
      radius,
    );

    const cached = await this.redisService.get<ApiResponse<GetNearbyServicesResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceService.getNearbyServices(user, query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({
    title: 'Get My Services',
    description: 'Get all services for the current provider with pagination',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'filter', type: String, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @Get('my-services')
  async getMyServices(
    @CurrentUser() user: User,
    @Query() query: QueryParams,
  ): Promise<ApiResponse<GetMyServicesResponse>> {
    const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};
    const cacheKey = this.getCacheKey('my', user.id, page, limit, search, filter, sort);

    const cached = await this.redisService.get<ApiResponse<GetMyServicesResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceService.getMyServices(user, query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({
    title: 'Create Service',
    description: 'Create a new service (Provider only).',
    type: CreateServiceDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @Post()
  async createService(
    @CurrentUser() user: User,
    @Body() createServiceDto: CreateServiceDto,
    @UploadedFiles() images?: MulterFile[],
  ): Promise<ApiResponse<ServiceSelect>> {
    const response = await this.serviceService.createService(user, createServiceDto, images);
    await this.invalidateServiceCache();
    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Update Service', description: 'Update a service (Provider only)', type: UpdateServiceDto })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: String, description: 'Service ID' })
  @UseInterceptors(FilesInterceptor('images', 10))
  @Put(':id')
  async updateService(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @UploadedFiles() images?: MulterFile[],
  ): Promise<ApiResponse<ServiceSelect>> {
    const response = await this.serviceService.updateService(user, id, updateServiceDto, images);
    await this.invalidateServiceCache();
    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({ title: 'Delete Service', description: 'Delete a service (Provider only)' })
  @ApiParam({ name: 'id', type: String, description: 'Service ID' })
  @Delete(':id')
  async deleteService(@CurrentUser() user: User, @Param('id') id: string): Promise<ApiResponse<void>> {
    const response = await this.serviceService.deleteService(user, id);
    await this.invalidateServiceCache();
    return response;
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get Service By ID', description: 'Get detailed service information by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Service ID' })
  @Get(':id')
  async getServiceById(@Param('id') id: string): Promise<ApiResponse<GetServiceByIdResponse>> {
    const cacheKey = this.getCacheKey('id', id);

    const cached = await this.redisService.get<ApiResponse<GetServiceByIdResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.serviceService.getServiceById(id);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }
}
