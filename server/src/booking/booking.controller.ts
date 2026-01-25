import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiProperty, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User, UserRole } from '@db';
import { ApiResponse, QueryParams } from 'src/common/types';
import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { CreateBookingResponse, GetAllBookingsResponse, GetBookingByIdResponse } from './types';
import { BookingSelect } from './queries';
import { RedisService } from 'src/common/services/redis.service';

@Controller('booking')
@ApiTags('Booking')
@UseGuards(AuthGuard)
export class BookingController {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly bookingService: BookingService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(prefix: string, ...params: (string | number | undefined)[]): string {
    const keyParts = params.filter((p) => p !== undefined && p !== null && p !== '');
    return `booking:${prefix}:${keyParts.join(':')}`;
  }

  private async invalidateBookingCache(bookingId?: string): Promise<void> {
    const client = this.redisService.getClient();
    if (bookingId) {
      const keys = await client.keys(`booking:*:${bookingId}*`);
      if (keys.length > 0) {
        await this.redisService.deleteMany(keys);
      }
    }
    const allKeys = await client.keys('booking:*');
    if (allKeys.length > 0) {
      await this.redisService.deleteMany(allKeys);
    }
  }

  @Roles(UserRole.SEEKER)
  @ApiProperty({
    title: 'Create Booking',
    description: 'Create a new booking request for a service',
    type: CreateBookingDto,
  })
  @Post()
  async createBooking(
    @CurrentUser() user: User,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<ApiResponse<CreateBookingResponse>> {
    const response = await this.bookingService.createBooking(user, createBookingDto);
    await this.invalidateBookingCache();
    return response;
  }

  @Roles(UserRole.SEEKER)
  @ApiProperty({
    title: 'Get My Bookings (Seeker)',
    description: 'Get all bookings of the current seeker with pagination',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'filter', type: String, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @Get('my-bookings/seeker')
  async getMyBookingsAsSeeker(
    @CurrentUser() user: User,
    @Query() query: QueryParams,
  ): Promise<ApiResponse<GetAllBookingsResponse>> {
    const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};
    const cacheKey = this.getCacheKey('seeker', user.id, page, limit, search, filter, sort);

    const cached = await this.redisService.get<ApiResponse<GetAllBookingsResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.bookingService.getMyBookingsAsSeeker(user, query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  @Roles(UserRole.PROVIDER)
  @ApiProperty({
    title: 'Get My Bookings (Provider)',
    description: 'Get all bookings requested to the current provider with pagination',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'filter', type: String, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @Get('my-bookings/provider')
  async getMyBookingsAsProvider(
    @CurrentUser() user: User,
    @Query() query: QueryParams,
  ): Promise<ApiResponse<GetAllBookingsResponse>> {
    const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};
    const cacheKey = this.getCacheKey('provider', user.id, page, limit, search, filter, sort);

    const cached = await this.redisService.get<ApiResponse<GetAllBookingsResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.bookingService.getMyBookingsAsProvider(user, query);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get Booking By ID', description: 'Get complete booking details by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Booking ID' })
  @Get(':id')
  async getBookingById(@Param('id') id: string): Promise<ApiResponse<GetBookingByIdResponse>> {
    const cacheKey = this.getCacheKey('id', id);

    const cached = await this.redisService.get<ApiResponse<GetBookingByIdResponse>>(cacheKey);
    if (cached) return cached;

    const response = await this.bookingService.getBookingById(id);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({
    title: 'Update Booking Status',
    description: 'Update the booking status (fast and lightweight)',
    type: UpdateBookingStatusDto,
  })
  @ApiParam({ name: 'id', type: String, description: 'Booking ID' })
  @Put(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ): Promise<ApiResponse<void>> {
    const response = await this.bookingService.updateBookingStatus(id, updateStatusDto);
    await this.invalidateBookingCache(id);
    return response;
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({
    title: 'Update Booking',
    description: 'Update booking fields (except seeker, provider, status)',
    type: UpdateBookingDto,
  })
  @ApiParam({ name: 'id', type: String, description: 'Booking ID' })
  @Put(':id')
  async updateBooking(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<ApiResponse<BookingSelect>> {
    const response = await this.bookingService.updateBooking(user, id, updateBookingDto);
    await this.invalidateBookingCache(id);
    return response;
  }
}
