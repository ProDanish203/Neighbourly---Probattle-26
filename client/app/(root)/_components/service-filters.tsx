'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { ServiceCategory } from '@/schema/service-category.schema';

interface ServiceFiltersProps {
  categoryId: string;
  onCategoryChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  sort: string;
  onSortChange: (value: string) => void;
  categories: ServiceCategory[];
  isLoadingCategories: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ServiceFilters({
  categoryId,
  onCategoryChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  radius,
  onRadiusChange,
  sort,
  onSortChange,
  categories,
  isLoadingCategories,
  hasActiveFilters,
  onClearFilters,
}: ServiceFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              {isLoadingCategories ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={categoryId} onValueChange={onCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: ServiceCategory) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Min Price</Label>
              <Input
                type="number"
                placeholder="Min"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Price</Label>
              <Input
                type="number"
                placeholder="Max"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Search Radius: {radius}km</Label>
            </div>
            <Slider
              value={[radius]}
              onValueChange={(values) => onRadiusChange(values[0])}
              min={2}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2km</span>
              <span>5km</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
