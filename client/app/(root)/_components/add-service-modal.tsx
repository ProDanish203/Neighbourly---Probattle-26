'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createServiceSchema, type CreateServiceSchema, type UpdateServiceSchema } from '@/schema/service.schema';
import { createService, updateService } from '@/API/service.api';
import { getAllServiceCategories } from '@/API/service-category.api';
import { ImageDropbox } from './image-dropbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceSchema } from '@/schema/service.schema';
import { z } from 'zod';
import { ServiceCategory } from '@/schema/service-category.schema';

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceSchema;
}

const formSchema = createServiceSchema;
type FormData = z.infer<typeof formSchema>;

export function AddServiceModal({ open, onOpenChange, service }: AddServiceModalProps) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const isEditMode = !!service;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: undefined,
      categoryId: '',
      address: '',
    },
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const result = await getAllServiceCategories({ page: 1, limit: 100 });
      if (!result.success) {
        toast.error(typeof result.response === 'string' ? result.response : 'Failed to load categories');
        return null;
      }
      return result.response;
    },
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.categories || [];

  useEffect(() => {
    if (open) {
      if (service) {
        setValue('name', service.name);
        setValue('description', service.description || '');
        setValue('price', service.price);
        setValue('duration', service.duration || undefined);
        setValue('categoryId', service.category.id);
        setValue('address', service.address);
        setImages([]);
      } else {
        reset();
        setImages([]);
      }
    }
  }, [open, service, setValue, reset]);

  const { mutateAsync: createServiceMutate, isPending: isCreating } = useMutation({
    mutationFn: (data: { payload: CreateServiceSchema; images: File[] }) => createService(data.payload, data.images),
  });

  const { mutateAsync: updateServiceMutate, isPending: isUpdating } = useMutation({
    mutationFn: (data: { id: string; payload: UpdateServiceSchema; images?: File[] }) =>
      updateService(data.id, data.payload, data.images),
  });

  const onSubmit = async (data: FormData) => {
    if (!isEditMode && images.length < 1) {
      toast.error('Please upload at least 1 image');
      return;
    }

    if (images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    try {
      if (isEditMode) {
        const updatePayload: UpdateServiceSchema = {
          name: data.name,
          description: data.description || undefined,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          address: data.address,
        };

        const { success, response } = await updateServiceMutate({
          id: service.id,
          payload: updatePayload,
          images: images.length > 0 ? images : undefined,
        });

        if (!success) {
          toast.error(typeof response === 'string' ? response : 'Failed to update service');
          return;
        }

        toast.success('Service updated successfully');
        queryClient.invalidateQueries({ queryKey: ['myServices'] });
        onOpenChange(false);
      } else {
        const createPayload: CreateServiceSchema = {
          name: data.name,
          description: data.description || undefined,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          address: data.address,
        };

        const { success, response } = await createServiceMutate({
          payload: createPayload,
          images,
        });

        if (!success) {
          toast.error(typeof response === 'string' ? response : 'Failed to create service');
          return;
        }

        toast.success('Service created successfully');
        queryClient.invalidateQueries({ queryKey: ['myServices'] });
        reset();
        setImages([]);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update your service details below.' : 'Fill in the details to create a new service.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Service Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register('name')} aria-invalid={errors.name ? 'true' : 'false'} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...register('description')}
              aria-invalid={errors.description ? 'true' : 'false'}
              placeholder="Describe your service..."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                aria-invalid={errors.price ? 'true' : 'false'}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register('duration', { valueAsNumber: true })}
                aria-invalid={errors.duration ? 'true' : 'false'}
                placeholder="Optional"
              />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              Category <span className="text-destructive">*</span>
            </Label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading categories...</span>
              </div>
            ) : (
              <Select value={watch('categoryId') || ''} onValueChange={(value) => setValue('categoryId', value)}>
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: ServiceCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input id="address" {...register('address')} aria-invalid={errors.address ? 'true' : 'false'} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images {!isEditMode && <span className="text-destructive">*</span>} (Min: 1, Max: 5)</Label>
            <ImageDropbox
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              minImages={isEditMode ? 0 : 1}
              error={!isEditMode && images.length < 1 ? 'At least 1 image is required' : undefined}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditMode ? (
                'Update Service'
              ) : (
                'Create Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
