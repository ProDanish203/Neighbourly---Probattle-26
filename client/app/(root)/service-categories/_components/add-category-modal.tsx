'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceCategorySchema,
  type CreateServiceCategory,
  type UpdateServiceCategory,
  type ServiceCategory,
} from '@/schema/service-category.schema';
import { createServiceCategory, updateServiceCategory, getParentServiceCategories } from '@/API/service-category.api';
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
import { z } from 'zod';

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ServiceCategory;
}

const formSchema = createServiceCategorySchema;
type FormData = z.infer<typeof formSchema>;

export function AddCategoryModal({ open, onOpenChange, category }: AddCategoryModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!category;

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
      parentId: undefined,
    },
  });

  const { data: parentsData, isLoading: isLoadingParents } = useQuery({
    queryKey: ['parentServiceCategories'],
    queryFn: async () => {
      const result = await getParentServiceCategories({ page: 1, limit: 100 });
      if (!result.success) {
        toast.error(typeof result.response === 'string' ? result.response : 'Failed to load parent categories');
        return null;
      }
      return result.response;
    },
  });

  const parents = Array.isArray(parentsData) ? parentsData : parentsData?.categories || [];

  useEffect(() => {
    if (open) {
      if (category) {
        setValue('name', category.name);
        setValue('description', category.description || '');
        setValue('parentId', category.parentId || undefined);
      } else {
        reset();
      }
    }
  }, [open, category, setValue, reset]);

  const { mutateAsync: createCategoryMutate, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateServiceCategory) => createServiceCategory(payload),
  });

  const { mutateAsync: updateCategoryMutate, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceCategory }) => updateServiceCategory(id, payload),
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        const updatePayload: UpdateServiceCategory = {
          name: data.name,
          description: data.description || undefined,
          parentId: data.parentId || undefined,
        };

        const { success, response } = await updateCategoryMutate({
          id: category.id,
          payload: updatePayload,
        });

        if (!success) {
          toast.error(typeof response === 'string' ? response : 'Failed to update category');
          return;
        }

        toast.success('Category updated successfully');
        queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
        queryClient.invalidateQueries({ queryKey: ['parentServiceCategories'] });
        onOpenChange(false);
      } else {
        const createPayload: CreateServiceCategory = {
          name: data.name,
          description: data.description || undefined,
          parentId: data.parentId || undefined,
        };

        const { success, response } = await createCategoryMutate(createPayload);

        if (!success) {
          toast.error(typeof response === 'string' ? response : 'Failed to create category');
          return;
        }

        toast.success('Category created successfully');
        queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
        queryClient.invalidateQueries({ queryKey: ['parentServiceCategories'] });
        reset();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the category details below.' : 'Fill in the details to create a new category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-destructive">*</span>
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
              placeholder="Describe the category..."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category (Optional)</Label>
            {isLoadingParents ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading parent categories...</span>
              </div>
            ) : (
              <Select
                value={watch('parentId') || ''}
                onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger id="parentId" className="w-full">
                  <SelectValue placeholder="Select a parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level category)</SelectItem>
                  {parents
                    .filter((parent: ServiceCategory) => !isEditMode || parent.id !== category.id)
                    .map((parent: ServiceCategory) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {errors.parentId && <p className="text-sm text-destructive">{errors.parentId.message}</p>}
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
                'Update Category'
              ) : (
                'Create Category'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
