import { Prisma } from '@db';
import { minimalUserSelect } from 'src/user/queries';
import { minimalServiceSelect } from 'src/service/queries';

export const bookingSelect = {
  id: true,
  seekerId: true,
  serviceId: true,
  providerId: true,
  status: true,
  startDateTime: true,
  endDateTime: true,
  totalPrice: true,
  address: true,
  rating: true,
  review: true,
  cancelledReason: true,
  createdAt: true,
  updatedAt: true,
  seeker: {
    select: minimalUserSelect,
  },
  provider: {
    select: minimalUserSelect,
  },
  service: {
    select: minimalServiceSelect,
  },
} satisfies Prisma.BookingSelect;

export type BookingSelect = Prisma.BookingGetPayload<{
  select: typeof bookingSelect;
}>;
