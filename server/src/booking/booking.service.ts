import { Prisma, User, UserRole, BookingStatus } from '@db';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ApiResponse, QueryParams } from 'src/common/types';
import { throwError } from 'src/common/utils/helpers';
import { bookingSelect, BookingSelect } from './queries';
import { MinimalUserSelect } from 'src/user/queries';
import { MinimalServiceSelect } from 'src/service/queries';
import { CreateBookingResponse, GetAllBookingsResponse, GetBookingByIdResponse } from './types';
import { CreateBookingDto, UpdateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async populateUserImages(user: MinimalUserSelect): Promise<MinimalUserSelect> {
    return {
      ...user,
      avatar: user.avatar ? this.storageService.getImageUrl(user.avatar) : null,
    };
  }

  private async populateServiceImages(service: MinimalServiceSelect): Promise<MinimalServiceSelect> {
    return {
      ...service,
      images: service.images.map((image) => this.storageService.getImageUrl(image)),
    };
  }

  private async populateBookingData(booking: BookingSelect): Promise<BookingSelect> {
    const [seekerWithImage, providerWithImage, serviceWithImages] = await Promise.all([
      this.populateUserImages(booking.seeker),
      this.populateUserImages(booking.provider),
      this.populateServiceImages(booking.service),
    ]);

    return {
      ...booking,
      seeker: seekerWithImage,
      provider: providerWithImage,
      service: serviceWithImages,
    };
  }

  async createBooking(user: User, createBookingDto: CreateBookingDto): Promise<ApiResponse<CreateBookingResponse>> {
    try {
      const { serviceId, startDateTime, endDateTime, address } = createBookingDto;

      const service = await this.prismaService.service.findUnique({
        where: { id: serviceId, isActive: true },
        select: {
          id: true,
          providerId: true,
          isActive: true,
          price: true,
          duration: true,
        },
      });

      if (!service) 
        throw throwError('Service not found', HttpStatus.NOT_FOUND);

      if (!service.isActive) 
        throw throwError('Service is not active and cannot be booked', HttpStatus.BAD_REQUEST);

      if (service.providerId === user.id) 
        throw throwError('You cannot book your own service', HttpStatus.BAD_REQUEST);

      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      const now = new Date();

      if (isNaN(startDate.getTime())) {
        throw throwError('Invalid start date time format', HttpStatus.BAD_REQUEST);
      }

      if (isNaN(endDate.getTime()))
        throw throwError('Invalid end date time format', HttpStatus.BAD_REQUEST);

      if (startDate <= now) 
        throw throwError('Start date time must be in the future', HttpStatus.BAD_REQUEST);

      if (endDate <= startDate) 
        throw throwError('End date time must be after start date time', HttpStatus.BAD_REQUEST);

      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      if (durationMinutes < 15)
        throw throwError('Booking duration must be at least 15 minutes', HttpStatus.BAD_REQUEST);

      if (service.price <= 0)
        throw throwError('Service price must be greater than 0', HttpStatus.BAD_REQUEST);

      // Check for overlapping bookings for the same service
      // A booking overlaps if:
      // - It's not CANCELLED or REJECTED
      // - The time ranges overlap (start < other.end && end > other.start)
      const overlappingBooking = await this.prismaService.booking.findFirst({
        where: {
          serviceId,
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
          },
          OR: [
            // New booking starts during an existing booking
            {
              startDateTime: { lte: startDate },
              endDateTime: { gt: startDate },
            },
            // New booking ends during an existing booking
            {
              startDateTime: { lt: endDate },
              endDateTime: { gte: endDate },
            },
            // New booking completely contains an existing booking
            {
              startDateTime: { gte: startDate },
              endDateTime: { lte: endDate },
            },
            // New booking is completely contained by an existing booking
            {
              startDateTime: { lte: startDate },
              endDateTime: { gte: endDate },
            },
          ],
        },
      });

      if (overlappingBooking) {
        throw throwError(
          'This time slot is already booked. Please choose a different time.',
          HttpStatus.CONFLICT,
        );
      }

      // Create the booking with price from service
      const booking = await this.prismaService.booking.create({
        data: {
          seekerId: user.id,
          serviceId,
          providerId: service.providerId,
          startDateTime: startDate,
          endDateTime: endDate,
          totalPrice: service.price,
          address: address.trim(),
          status: BookingStatus.PENDING,
        },
        select: bookingSelect,
      });

      const bookingWithPopulatedData = await this.populateBookingData(booking);

      return {
        message: 'Booking created successfully',
        success: true,
        data: {
          booking: bookingWithPopulatedData,
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to create booking', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMyBookingsAsSeeker(user: User, query?: QueryParams): Promise<ApiResponse<GetAllBookingsResponse>> {
    try {
      const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};

      const where: Prisma.BookingWhereInput = {
        seekerId: user.id,
      };
      const orderBy: Prisma.BookingOrderByWithRelationInput = {};

      if (filter) orderBy[filter] = 'asc';
      if (sort) orderBy[sort] = 'desc';
      if (!filter && !sort) orderBy.createdAt = 'desc';

      const [bookings, totalCount] = await Promise.all([
        this.prismaService.booking.findMany({
          select: bookingSelect,
          where,
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        this.prismaService.booking.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      const bookingsWithPopulatedData = await Promise.all(bookings.map((booking) => this.populateBookingData(booking)));

      return {
        message: 'Bookings retrieved successfully',
        success: true,
        data: {
          bookings: bookingsWithPopulatedData,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
          },
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve bookings', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMyBookingsAsProvider(user: User, query?: QueryParams): Promise<ApiResponse<GetAllBookingsResponse>> {
    try {
      const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};

      const where: Prisma.BookingWhereInput = {
        providerId: user.id,
      };
      const orderBy: Prisma.BookingOrderByWithRelationInput = {};

      if (filter) orderBy[filter] = 'asc';
      if (sort) orderBy[sort] = 'desc';
      if (!filter && !sort) orderBy.createdAt = 'desc';

      const [bookings, totalCount] = await Promise.all([
        this.prismaService.booking.findMany({
          select: bookingSelect,
          where,
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        this.prismaService.booking.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      const bookingsWithPopulatedData = await Promise.all(bookings.map((booking) => this.populateBookingData(booking)));

      return {
        message: 'Bookings retrieved successfully',
        success: true,
        data: {
          bookings: bookingsWithPopulatedData,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
          },
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve bookings', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getBookingById(bookingId: string): Promise<ApiResponse<GetBookingByIdResponse>> {
    try {
      const booking = await this.prismaService.booking.findUnique({
        where: { id: bookingId },
        select: bookingSelect,
      });

      if (!booking) throw throwError('Booking not found', HttpStatus.NOT_FOUND);

      const bookingWithPopulatedData = await this.populateBookingData(booking);

      return {
        message: 'Booking retrieved successfully',
        success: true,
        data: {
          booking: bookingWithPopulatedData,
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve booking', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateBookingStatus(bookingId: string, updateStatusDto: UpdateBookingStatusDto): Promise<ApiResponse<void>> {
    try {
      const existingBooking = await this.prismaService.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true },
      });

      if (!existingBooking) throw throwError('Booking not found', HttpStatus.NOT_FOUND);

      if (existingBooking.status === BookingStatus.CONFIRMED)
        throw throwError('Cannot change booking status when current status is CONFIRMED', HttpStatus.BAD_REQUEST);

      await this.prismaService.booking.update({
        where: { id: bookingId },
        data: {
          status: updateStatusDto.status,
        },
      });

      return {
        message: 'Booking status updated successfully',
        success: true,
      };
    } catch (err) {
      throw throwError(
        err.message || 'Failed to update booking status',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBooking(
    user: User,
    bookingId: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<ApiResponse<BookingSelect>> {
    try {
      const existingBooking = await this.prismaService.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, seekerId: true, providerId: true, status: true },
      });

      if (!existingBooking) throw throwError('Booking not found', HttpStatus.NOT_FOUND);

      // Verify user is either seeker or provider of the booking
      if (existingBooking.seekerId !== user.id && existingBooking.providerId !== user.id) {
        throw throwError('You do not have permission to update this booking', HttpStatus.FORBIDDEN);
      }

      const { startDateTime, endDateTime, totalPrice, address, rating, review, cancelledReason } = updateBookingDto;

      // cancelledReason should only be set when status is CANCELLED
      if (cancelledReason !== undefined && existingBooking.status !== BookingStatus.CANCELLED) {
        throw throwError('Cancelled reason can only be set when booking status is CANCELLED', HttpStatus.BAD_REQUEST);
      }

      // Cannot update CANCELLED or REJECTED bookings (except for cancelledReason on CANCELLED bookings)
      if (existingBooking.status === BookingStatus.CANCELLED || existingBooking.status === BookingStatus.REJECTED) {
        const hasOtherUpdates =
          startDateTime !== undefined ||
          endDateTime !== undefined ||
          totalPrice !== undefined ||
          address !== undefined ||
          rating !== undefined ||
          review !== undefined ||
          (existingBooking.status === BookingStatus.REJECTED && cancelledReason !== undefined);
        if (hasOtherUpdates) {
          throw throwError('Cannot update a booking that is CANCELLED or REJECTED', HttpStatus.BAD_REQUEST);
        }
      }

      // Rating and review can only be given by the seeker
      if ((rating !== undefined || review !== undefined) && existingBooking.seekerId !== user.id) {
        throw throwError('Only the seeker can provide rating and review', HttpStatus.FORBIDDEN);
      }

      // Rating should only be allowed when booking is COMPLETED
      if (rating !== undefined && existingBooking.status !== BookingStatus.COMPLETED) {
        throw throwError('Rating can only be given when booking is COMPLETED', HttpStatus.BAD_REQUEST);
      }

      // Review cannot be given until booking is COMPLETED
      if (review !== undefined && existingBooking.status !== BookingStatus.COMPLETED) {
        throw throwError('Review can only be given when booking is COMPLETED', HttpStatus.BAD_REQUEST);
      }

      // If booking is CONFIRMED or COMPLETED, address, startDateTime, endDateTime, and totalPrice cannot be updated
      if (existingBooking.status === BookingStatus.CONFIRMED || existingBooking.status === BookingStatus.COMPLETED) {
        if (
          startDateTime !== undefined ||
          endDateTime !== undefined ||
          totalPrice !== undefined ||
          address !== undefined
        ) {
          throw throwError(
            'Cannot update address, start date, end date, or total price when booking is CONFIRMED or COMPLETED',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const updateData: Prisma.BookingUpdateInput = {};
      if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime);
      if (endDateTime !== undefined) updateData.endDateTime = new Date(endDateTime);
      if (totalPrice !== undefined) updateData.totalPrice = Number(totalPrice);
      if (address !== undefined) updateData.address = address;
      if (rating !== undefined) updateData.rating = Number(rating);
      if (review !== undefined) updateData.review = review;
      if (cancelledReason !== undefined) updateData.cancelledReason = cancelledReason;

      const updatedBooking = await this.prismaService.booking.update({
        where: { id: bookingId },
        data: updateData,
        select: bookingSelect,
      });

      const bookingWithPopulatedData = await this.populateBookingData(updatedBooking);

      return {
        message: 'Booking updated successfully',
        success: true,
        data: bookingWithPopulatedData,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to update booking', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
