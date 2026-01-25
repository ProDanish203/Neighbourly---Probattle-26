import { PaginationInfo } from 'src/common/types';
import { BookingSelect } from '../queries';

export interface GetAllBookingsResponse {
  bookings: BookingSelect[];
  pagination: PaginationInfo;
}

export interface GetBookingByIdResponse {
  booking: BookingSelect;
}

export interface CreateBookingResponse {
  booking: BookingSelect;
}
