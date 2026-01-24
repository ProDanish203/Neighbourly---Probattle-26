'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getMyServices } from '@/API/service.api';
import { AddServiceModal } from './add-service-modal';
import { Pagination } from './pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Clock, DollarSign, Eye, Image as ImageIcon } from 'lucide-react';
import { ServiceSchema } from '@/schema/service.schema';
import Link from 'next/link';
import Image from 'next/image';

export function ProviderServicesPage() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceSchema | undefined>(undefined);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['myServices', page, limit],
    queryFn: async () => {
      const result = await getMyServices({ page, limit });
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load services');
      }
      return result.response;
    },
  });

  const services: ServiceSchema[] = data?.services || [];
  const pagination = data?.pagination;

  const handleAddService = () => {
    setEditingService(undefined);
    setIsModalOpen(true);
  };

  const handleEditService = (service: ServiceSchema) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingService(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-xl" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">Failed to load services. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Services</h1>
          <p className="text-muted-foreground">
            Manage and view all your offered services. Create new services to expand your offerings.
          </p>
        </div>
        <Button onClick={handleAddService} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by creating your first service. Share what you offer and start connecting with customers.
            </p>
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col">
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                  {service.images && service.images.length > 0 ? (
                    <Image
                      src={service.images[0]}
                      alt={service.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {!service.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{service.name}</CardTitle>
                  </div>
                  {service.description && (
                    <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-foreground">${service.price.toFixed(2)}</span>
                    </div>
                    {service.duration && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{service.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{service.category.name}</Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditService(service)}>
                      Edit
                    </Button>
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <Link href={`/service/${service.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && <Pagination pagination={pagination} />}
        </>
      )}

      {/* Add/Edit Service Modal */}
      <AddServiceModal open={isModalOpen} onOpenChange={handleModalClose} service={editingService} />
    </div>
  );
}
