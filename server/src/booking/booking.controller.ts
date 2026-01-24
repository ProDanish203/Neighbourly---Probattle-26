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

@Controller('booking')
@ApiTags('Booking')
@UseGuards(AuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

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
    return await this.bookingService.createBooking(user, createBookingDto);
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
    return await this.bookingService.getMyBookingsAsSeeker(user, query);
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
    return await this.bookingService.getMyBookingsAsProvider(user, query);
  }

  @Roles(...Object.values(UserRole))
  @ApiProperty({ title: 'Get Booking By ID', description: 'Get complete booking details by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Booking ID' })
  @Get(':id')
  async getBookingById(@Param('id') id: string): Promise<ApiResponse<GetBookingByIdResponse>> {
    return await this.bookingService.getBookingById(id);
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
    return await this.bookingService.updateBookingStatus(id, updateStatusDto);
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
    return await this.bookingService.updateBooking(user, id, updateBookingDto);
  }
}
