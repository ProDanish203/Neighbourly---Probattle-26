'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getMyBookingsAsSeeker, getMyBookingsAsProvider } from '@/API/booking.api';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { BookingsTable } from './_components/bookings-table';
import { Pagination } from '../_components/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function BookingsContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const isSeeker = user?.role === UserRole.SEEKER;
  const isProvider = user?.role === UserRole.PROVIDER;

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', user?.role, page, limit],
    queryFn: async () => {
      if (isSeeker) {
        const result = await getMyBookingsAsSeeker({ page, limit });
        if (!result.success) {
          throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load bookings');
        }
        return result.response;
      } else if (isProvider) {
        const result = await getMyBookingsAsProvider({ page, limit });
        if (!result.success) {
          throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load bookings');
        }
        return result.response;
      }
      return null;
    },
    enabled: !!user && (isSeeker || isProvider),
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;

  if (!user) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <BookingsTable bookings={[]} isLoading={true} userRole={user.role} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Failed to load bookings. Please try again.</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            {isSeeker
              ? 'View and manage all your service bookings.'
              : 'View and manage all bookings for your services.'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
            <CardDescription>
              {isSeeker ? 'All services you have booked from providers' : 'All bookings for your services'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsTable bookings={bookings} isLoading={false} userRole={user.role} />
            {pagination && (
              <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <Pagination pagination={pagination} />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container px-4 py-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
