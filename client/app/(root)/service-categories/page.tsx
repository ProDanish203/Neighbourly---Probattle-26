'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getAllServiceCategories,
  getParentServiceCategories,
  getServiceCategoryByParent,
  deleteServiceCategory,
} from '@/API/service-category.api';
import { ServiceCategory } from '@/schema/service-category.schema';
import { AddCategoryModal } from './_components/add-category-modal';
import { Pagination } from '../_components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, ChevronDown, ChevronRight, Folder, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Component to fetch and display children for a parent category
function CategoryChildren({
  parentId,
  isExpanded,
  onEdit,
  onDelete,
}: {
  parentId: string;
  isExpanded: boolean;
  onEdit: (category: ServiceCategory) => void;
  onDelete: (category: ServiceCategory) => void;
}) {
  const { data: childrenData, isLoading } = useQuery({
    queryKey: ['serviceCategoryChildren', parentId],
    queryFn: async () => {
      const result = await getServiceCategoryByParent(parentId, { page: 1, limit: 100 });
      if (!result.success) {
        return [];
      }
      return Array.isArray(result.response) ? result.response : result.response?.categories || [];
    },
    enabled: isExpanded,
  });

  const children: ServiceCategory[] = childrenData || [];

  if (!isExpanded) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="ml-8 border-l-2 border-muted pl-4">
        <p className="text-sm text-muted-foreground py-4">No child categories</p>
      </div>
    );
  }

  return (
    <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
      {children.map((child) => (
        <CategoryCard
          key={child.id}
          category={child}
          isChild={true}
          onEdit={() => onEdit(child)}
          onDelete={() => onDelete(child)}
        />
      ))}
    </div>
  );
}

// Reusable category card component
function CategoryCard({
  category,
  isChild = false,
  onEdit,
  onDelete,
}: {
  category: ServiceCategory;
  isChild?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Image */}
          <div
            className={`relative ${isChild ? 'h-16 w-16' : 'h-20 w-20'} rounded-lg overflow-hidden border shrink-0 bg-muted`}
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes={isChild ? '64px' : '80px'}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className={`${isChild ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground`} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className={isChild ? 'text-base' : 'text-lg'}>{category.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {isChild ? 'Child' : 'Parent'}
                  </Badge>
                </div>
                {category.description && (
                  <CardDescription className="line-clamp-2 mt-1">{category.description}</CardDescription>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceCategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit] = useState(Number(searchParams.get('limit')) || 12);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | undefined>();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'parents'>('all');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentPage, limit, router]);

  // Fetch all categories or parent categories based on view mode
  const { data, isLoading, error } = useQuery({
    queryKey: ['serviceCategories', currentPage, limit, viewMode],
    queryFn: async () => {
      const params = { page: currentPage, limit };
      const result =
        viewMode === 'parents' ? await getParentServiceCategories(params) : await getAllServiceCategories(params);
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load categories');
      }
      return result.response;
    },
  });

  const categories: ServiceCategory[] = Array.isArray(data) ? data : data?.categories || [];
  const pagination = data?.pagination;

  // Fetch children for expanded parent categories
  const expandedParentIds = Array.from(expandedParents);

  // Use a custom hook-like approach or fetch all children at once
  // For now, we'll use the children that come with the main query
  // and fetch additional ones when needed

  const { mutateAsync: deleteCategoryMutate, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteServiceCategory(id),
  });

  const handleDelete = async (category: ServiceCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { success, response } = await deleteCategoryMutate(category.id);
      if (!success) {
        toast.error(typeof response === 'string' ? response : 'Failed to delete category');
        return;
      }
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
      queryClient.invalidateQueries({ queryKey: ['parentServiceCategories'] });
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingCategory(undefined);
    setShowAddModal(true);
  };

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  // Separate parent and child categories
  const parentCategories = categories.filter((cat) => !cat.parentId);
  const childCategoriesMap = new Map<string, ServiceCategory[]>();
  categories.forEach((cat) => {
    if (cat.parentId) {
      if (!childCategoriesMap.has(cat.parentId)) {
        childCategoriesMap.set(cat.parentId, []);
      }
      childCategoriesMap.get(cat.parentId)!.push(cat);
    }
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-16 w-16 rounded-md shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Failed to load categories. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Service Categories</h1>
            <p className="text-muted-foreground">
              Manage and organize service categories with parent-child relationships.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setViewMode(viewMode === 'all' ? 'parents' : 'all')}>
              {viewMode === 'all' ? 'Show Parents Only' : 'Show All'}
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Get started by creating your first service category.
              </p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {parentCategories.map((parent) => {
                const localChildren = childCategoriesMap.get(parent.id) || [];
                const isExpanded = expandedParents.has(parent.id);
                const hasLocalChildren = localChildren.length > 0;

                return (
                  <div key={parent.id} className="space-y-2">
                    {/* Parent Category Card */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {/* Image */}
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden border shrink-0 bg-muted">
                            {parent.image ? (
                              <Image src={parent.image} alt={parent.name} fill className="object-cover" sizes="80px" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg">{parent.name}</CardTitle>
                                  <Badge variant="outline" className="text-xs">
                                    Parent
                                  </Badge>
                                </div>
                                {parent.description && (
                                  <CardDescription className="line-clamp-2 mt-1">{parent.description}</CardDescription>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleParentExpansion(parent.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(parent)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(parent)}
                                      className="text-destructive"
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Local Children (from current page) */}
                    {hasLocalChildren && (
                      <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
                        {localChildren.map((child) => (
                          <CategoryCard
                            key={child.id}
                            category={child}
                            isChild={true}
                            onEdit={() => handleEdit(child)}
                            onDelete={() => handleDelete(child)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Fetch and display additional children when expanded */}
                    <CategoryChildren
                      parentId={parent.id}
                      isExpanded={isExpanded}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                );
              })}

              {/* Standalone child categories (if any) - categories with parentId but parent not in current page */}
              {viewMode === 'all' &&
                categories
                  .filter((cat) => cat.parentId && !parentCategories.find((p) => p.id === cat.parentId))
                  .map((child) => (
                    <CategoryCard
                      key={child.id}
                      category={child}
                      isChild={true}
                      onEdit={() => handleEdit(child)}
                      onDelete={() => handleDelete(child)}
                    />
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

      {/* Add/Edit Modal */}
      <AddCategoryModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setEditingCategory(undefined);
          }
        }}
        category={editingCategory}
      />
    </div>
  );
}

export default function ServiceCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-16 w-16 rounded-md shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ServiceCategoryContent />
    </Suspense>
  );
}
