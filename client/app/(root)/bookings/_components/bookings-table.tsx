'use client';

import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingSchema } from '@/schema/booking.schema';
import { BookingStatus } from '@/lib/enums';
import { UserRole } from '@/lib/enums';

interface BookingsTableProps {
  bookings: BookingSchema[];
  isLoading?: boolean;
  userRole: UserRole;
}

const statusVariantMap: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [BookingStatus.PENDING]: 'outline',
  [BookingStatus.CONFIRMED]: 'default',
  [BookingStatus.COMPLETED]: 'secondary',
  [BookingStatus.CANCELLED]: 'destructive',
  [BookingStatus.REJECTED]: 'destructive',
};

const statusColorMap: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  [BookingStatus.CONFIRMED]:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  [BookingStatus.COMPLETED]:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [BookingStatus.CANCELLED]:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  [BookingStatus.REJECTED]:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const statusLabelMap: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.COMPLETED]: 'Completed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.REJECTED]: 'Rejected',
};

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BookingsTable({ bookings, isLoading, userRole }: BookingsTableProps) {
  const router = useRouter();
  const isSeeker = userRole === UserRole.SEEKER;

  const handleRowClick = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-4">Service</TableHead>
            <TableHead className="py-4">{isSeeker ? 'Provider' : 'Seeker'}</TableHead>
            <TableHead className="py-4">Start Date</TableHead>
            <TableHead className="py-4">End Date</TableHead>
            <TableHead className="py-4">Total Price</TableHead>
            <TableHead className="py-4">Status</TableHead>
            <TableHead className="py-4">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No bookings found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-4">Service</TableHead>
          <TableHead className="py-4">{isSeeker ? 'Provider' : 'Seeker'}</TableHead>
          <TableHead className="py-4">Start Date</TableHead>
          <TableHead className="py-4">End Date</TableHead>
          <TableHead className="py-4">Total Price</TableHead>
          <TableHead className="py-4">Status</TableHead>
          <TableHead className="py-4">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id} onClick={() => handleRowClick(booking.id)} className="cursor-pointer">
            <TableCell className="font-medium py-4">{booking.service.name}</TableCell>
            <TableCell className="py-4">{isSeeker ? booking.provider.name : booking.seeker.name}</TableCell>
            <TableCell className="py-4">{formatDateTime(booking.startDateTime)}</TableCell>
            <TableCell className="py-4">{formatDateTime(booking.endDateTime)}</TableCell>
            <TableCell className="font-semibold py-4">${booking.totalPrice.toFixed(2)}</TableCell>
            <TableCell className="py-4">
              <Badge variant={statusVariantMap[booking.status]} className={statusColorMap[booking.status]}>
                {statusLabelMap[booking.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground py-4">{formatDate(booking.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
