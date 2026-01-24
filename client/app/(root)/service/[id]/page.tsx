'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getServiceById } from '@/API/service.api';
import { createBooking } from '@/API/booking.api';
import { createBookingSchema, type CreateBookingSchema } from '@/schema/booking.schema';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, DollarSign, Calendar, User, Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';

const bookingFormSchema = createBookingSchema.extend({
  startDateTime: z.string().min(1, 'Start date and time is required'),
  endDateTime: z.string().min(1, 'End date and time is required'),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const serviceId = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isProvider = user?.role === UserRole.PROVIDER;
  const isSeeker = user?.role === UserRole.SEEKER;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: serviceId,
      providerId: '',
      startDateTime: '',
      endDateTime: '',
      address: '',
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const result = await getServiceById(serviceId);
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load service');
      }
      return result.response;
    },
  });

  const service = data?.service;

  useEffect(() => {
    if (service) {
      setValue('providerId', service.provider.id);
    }
  }, [service, setValue]);

  const { mutateAsync: createBookingMutate, isPending: isCreatingBooking } = useMutation({
    mutationFn: createBooking,
  });

  const startDateTime = watch('startDateTime');
  const endDateTime = watch('endDateTime');

  // Calculate total price based on duration
  const totalPrice = useMemo(() => {
    if (!service || !startDateTime || !endDateTime) return 0;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (service.duration) {
      // If service has a fixed duration, calculate based on that
      const numberOfPeriods = Math.ceil(diffDays / service.duration);
      return service.price * numberOfPeriods;
    } else {
      // If no fixed duration, calculate per day
      return service.price * diffDays;
    }
  }, [service, startDateTime, endDateTime]);

  // Set providerId when service loads
  if (service && watch('providerId') !== service.provider.id) {
    // This will be handled in useEffect
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!service) return;

    try {
      const payload: CreateBookingSchema = {
        serviceId: service.id,
        providerId: service.provider.id,
        startDateTime: new Date(data.startDateTime).toISOString(),
        endDateTime: new Date(data.endDateTime).toISOString(),
        address: data.address,
      };

      const { success, response } = await createBookingMutate(payload);

      if (!success) {
        toast.error(typeof response === 'string' ? response : 'Failed to create booking');
        return;
      }

      toast.success('Booking created successfully!');
      router.push('/bookings');
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Failed to load service. Please try again.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const images = service.images || [];
  const mainImage = images[selectedImageIndex] || images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={service.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {!service.isActive && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${service.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 12.5vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details and Booking Form */}
          <div className="space-y-6">
            {/* Service Details */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{service.category.name}</Badge>
                  {service.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>

              {service.description && <p className="text-muted-foreground leading-relaxed">{service.description}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-lg font-semibold">${service.price.toFixed(2)}</p>
                  </div>
                </div>

                {service.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-lg font-semibold">{service.duration} days</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-lg font-semibold">{service.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="text-lg font-semibold">{service.provider.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form - Only for Seekers */}
            {isSeeker && (
              <Card>
                <CardHeader>
                  <CardTitle>Book This Service</CardTitle>
                  <CardDescription>Fill in the details to book this service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...register('serviceId')} value={service.id} />
                    <input type="hidden" {...register('providerId')} value={service.provider.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDateTime">
                          Start Date & Time <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="startDateTime"
                          type="datetime-local"
                          {...register('startDateTime')}
                          aria-invalid={errors.startDateTime ? 'true' : 'false'}
                        />
                        {errors.startDateTime && (
                          <p className="text-sm text-destructive">{errors.startDateTime.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDateTime">
                          End Date & Time <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="endDateTime"
                          type="datetime-local"
                          {...register('endDateTime')}
                          aria-invalid={errors.endDateTime ? 'true' : 'false'}
                        />
                        {errors.endDateTime && <p className="text-sm text-destructive">{errors.endDateTime.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        Service Address <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        rows={3}
                        placeholder="Enter the address where the service will be provided"
                        {...register('address')}
                        aria-invalid={errors.address ? 'true' : 'false'}
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                    </div>

                    {/* Price Summary */}
                    {(startDateTime || endDateTime) && totalPrice > 0 && (
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Estimated Total</span>
                          <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
                        </div>
                        {service.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on service duration of {service.duration} days
                          </p>
                        )}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isCreatingBooking}>
                      {isCreatingBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Booking...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Service
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Provider View - View Only */}
            {isProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                  <CardDescription>This is your service listing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-2">Service Status</p>
                      <div className="flex items-center gap-2">
                        {service.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/">Manage Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
