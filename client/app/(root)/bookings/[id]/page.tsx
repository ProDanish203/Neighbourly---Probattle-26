'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getBookingById, updateBookingStatus } from '@/API/booking.api';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { BookingStatus } from '@/lib/enums';
import { updateBookingStatusSchema, type UpdateBookingStatusSchema } from '@/schema/booking.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, User, Package, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const bookingId = params.id as string;
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);

  const isProvider = user?.role === UserRole.PROVIDER;
  const isSeeker = user?.role === UserRole.SEEKER;
  const isOwner = isProvider || isSeeker;

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const result = await getBookingById(bookingId);
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load booking');
      }
      return result.response;
    },
  });

  const booking = data?.booking;

  // Set selected status when booking loads
  if (booking && selectedStatus === null && booking.status) {
    setSelectedStatus(booking.status as BookingStatus);
  }

  const { mutateAsync: updateStatusMutate, isPending: isUpdatingStatus } = useMutation({
    mutationFn: (payload: UpdateBookingStatusSchema) => updateBookingStatus(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking status updated successfully');
    },
  });

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !booking) return;

    const currentStatus = booking.status as BookingStatus;

    // Check if trying to change from CONFIRMED status
    if (currentStatus === BookingStatus.CONFIRMED) {
      toast.error('Cannot change booking status when current status is CONFIRMED');
      return;
    }

    // Check if status is the same
    if (selectedStatus === currentStatus) {
      toast.info('Status is already set to this value');
      return;
    }

    try {
      const { success, response } = await updateStatusMutate({ status: selectedStatus });
      if (!success) {
        toast.error(typeof response === 'string' ? response : 'Failed to update booking status');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus: BookingStatus): BookingStatus[] => {
    if (currentStatus === BookingStatus.CONFIRMED) {
      return [BookingStatus.CONFIRMED]; // Cannot change from CONFIRMED
    }

    const allStatuses = Object.values(BookingStatus) as BookingStatus[];
    // Filter out the current status
    return allStatuses.filter((status) => status !== currentStatus);
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive text-lg font-semibold">Failed to load booking</p>
          <p className="text-muted-foreground text-center max-w-md">
            {typeof error === 'string' ? error : 'The booking you are looking for could not be found.'}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const bookingStatus = booking.status as BookingStatus;
  const canUpdateStatus = bookingStatus !== BookingStatus.CONFIRMED;
  const availableStatuses = getAvailableStatuses(bookingStatus);
  const isCurrentUserProvider = user?.id === booking.providerId;
  const isCurrentUserSeeker = user?.id === booking.seekerId;

  return (
    <div className="container px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Badge
            variant={statusVariantMap[booking.status as BookingStatus]}
            className={statusColorMap[booking.status as BookingStatus]}
          >
            {statusLabelMap[booking.status as BookingStatus]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Booking Details */}
          <div className="space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service Name</p>
                  <p className="text-lg font-semibold">{booking.service.name}</p>
                </div>
                {booking.service.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{booking.service.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Service Price</p>
                    <p className="font-semibold">${booking.service.price.toFixed(2)}</p>
                  </div>
                </div>
                {booking.service.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{booking.service.duration} days</p>
                    </div>
                  </div>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/service/${booking.serviceId}`}>View Service Details</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date & Time</p>
                  <p className="font-semibold">{formatDateTime(booking.startDateTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date & Time</p>
                  <p className="font-semibold">{formatDateTime(booking.endDateTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Address</p>
                  <p className="font-semibold">{booking.address}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-2xl font-bold">${booking.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isProvider ? 'Seeker Information' : 'Provider Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{isProvider ? booking.seeker.name : booking.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{isProvider ? booking.seeker.email : booking.provider.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status Update & Additional Info */}
          <div className="space-y-6">
            {/* Status Update Card */}
            {(isCurrentUserProvider || isCurrentUserSeeker) && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Booking Status</CardTitle>
                  <CardDescription>
                    {canUpdateStatus
                      ? 'Change the status of this booking'
                      : 'Status cannot be changed when booking is CONFIRMED'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                    <div>
                      <Badge variant={statusVariantMap[bookingStatus]} className={statusColorMap[bookingStatus]}>
                        {statusLabelMap[bookingStatus]}
                      </Badge>
                    </div>
                  </div>

                  {canUpdateStatus && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="status">New Status</Label>
                        <Select
                          value={selectedStatus || bookingStatus}
                          onValueChange={(value) => setSelectedStatus(value as BookingStatus)}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabelMap[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedStatus && selectedStatus !== bookingStatus && (
                        <Button onClick={handleStatusUpdate} disabled={isUpdatingStatus} className="w-full">
                          {isUpdatingStatus ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update Status'
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-xs">{booking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">{formatDate(booking.updatedAt)}</p>
                </div>
                {booking.cancelledReason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancellation Reason</p>
                    <p className="text-sm">{booking.cancelledReason}</p>
                  </div>
                )}
                {booking.rating && (
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold">{booking.rating} / 5</p>
                  </div>
                )}
                {booking.review && (
                  <div>
                    <p className="text-sm text-muted-foreground">Review</p>
                    <p className="text-sm">{booking.review}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
