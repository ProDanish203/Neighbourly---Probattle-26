'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { getNearbyServices } from '@/API/service.api';
import { getAllServiceCategories } from '@/API/service-category.api';
import { Pagination } from './pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from './search-bar';
import { ServiceFilters } from './service-filters';
import { MapPin, Clock, DollarSign, Eye, Image as ImageIcon, Filter } from 'lucide-react';
import { ServiceCategory } from '@/schema/service-category.schema';
import Link from 'next/link';
import Image from 'next/image';
import useDebounce from '@/hooks/use-debounce';
import { ServiceSchema } from '@/schema/service.schema';

export function SeekerServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [radius, setRadius] = useState<number>(Number(searchParams.get('radius')) || 3);
  const [sort, setSort] = useState<string>(searchParams.get('sort') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedCategoryId = useDebounce(categoryId, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);
  const debouncedRadius = useDebounce(radius, 500);
  const debouncedSort = useDebounce(sort, 500);

  const page = debouncedSearch ? 1 : currentPage; // Reset to page 1 when searching
  const limit = Number(searchParams.get('limit')) || 10;

  useEffect(() => {
    if (debouncedSearch) setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedCategoryId, debouncedMinPrice, debouncedMaxPrice, debouncedRadius, debouncedSort]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (debouncedCategoryId) params.set('categoryId', debouncedCategoryId);
    if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
    if (debouncedRadius) params.set('radius', debouncedRadius.toString());
    if (debouncedSort) params.set('sort', debouncedSort);
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());

    const newUrl = `?${params.toString()}`;
    const currentUrl = window.location.search;

    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedCategoryId, debouncedMinPrice, debouncedMaxPrice, debouncedRadius, debouncedSort, currentPage, limit, router]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const result = await getAllServiceCategories({ page: 1, limit: 100 });
      if (!result.success) {
        return null;
      }
      return result.response;
    },
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.categories || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['nearbyServices', page, limit, debouncedSearch, debouncedCategoryId, debouncedMinPrice, debouncedMaxPrice, debouncedRadius, debouncedSort],
    queryFn: async () => {
      const params: any = {
        page: debouncedSearch ? 1 : page, // Always use page 1 when searching
        limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (debouncedCategoryId) params.categoryId = debouncedCategoryId;
      if (debouncedMinPrice) params.minPrice = Number(debouncedMinPrice);
      if (debouncedMaxPrice) params.maxPrice = Number(debouncedMaxPrice);
      if (debouncedRadius) params.radius = debouncedRadius;
      if (debouncedSort) params.sort = debouncedSort;

      const result = await getNearbyServices(params);
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load services');
      }
      return result.response;
    },
  });

  const services: ServiceSchema[] = data?.services || [];
  const pagination = data?.pagination;

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setRadius(3);
    setSort('');
    setCurrentPage(1);
    router.replace('?page=1&limit=10');
  };

  const hasActiveFilters = !!(debouncedCategoryId || debouncedMinPrice || debouncedMaxPrice || debouncedRadius !== 3 || debouncedSort || debouncedSearch);

  // Update currentPage when URL page param changes (from pagination)
  useEffect(() => {
    const urlPage = Number(searchParams.get('page')) || 1;
    if (urlPage !== currentPage && !debouncedSearch) {
      setCurrentPage(urlPage);
    }
  }, [searchParams, debouncedSearch, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Browse and discover services from providers near you.</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      <div className="space-y-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {showFilters && (
          <ServiceFilters
            categoryId={categoryId}
            onCategoryChange={(value) => setCategoryId(value === 'all' ? '' : value)}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            radius={radius}
            onRadiusChange={setRadius}
            sort={sort}
            onSortChange={setSort}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {hasActiveFilters
                ? 'Try adjusting your filters to find more services.'
                : 'No services are available in your area at the moment.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col hover:shadow-lg transition-shadow">
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
                        <span>{service.duration} days</span>
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

                  <Button variant="default" size="sm" className="w-full" asChild>
                    <Link href={`/service/${service.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Service
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination && (
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <Pagination pagination={pagination} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
