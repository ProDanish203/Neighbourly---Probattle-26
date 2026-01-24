'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { PaginationSchema } from '@/schema/common.schema';
import { cn } from '@/lib/utils';

interface PaginationProps {
  pagination: PaginationSchema;
  limitOptions?: number[];
}

export function Pagination({ pagination, limitOptions = [10, 20, 50, 100] }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQueryParam = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value.toString());
    else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) updateQueryParam('page', page);
  };

  const handleLimitChange = (limit: number) => {
    updateQueryParam('limit', limit);
    updateQueryParam('page', 1); // Reset to first page when changing limit
  };

  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const { page, totalPages } = pagination;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (pagination.totalPages === 0) {
    return null;
  }

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <span className="text-sm text-muted-foreground">
          ({pagination.totalCount} {pagination.totalCount === 1 ? 'item' : 'items'})
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNum, index) => {
          if (pageNum === 'ellipsis') {
            return (
              <Button key={`ellipsis-${index}`} variant="ghost" size="icon" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }

          return (
            <Button
              key={pageNum}
              variant={pageNum === pagination.page ? 'default' : 'outline'}
              size="icon"
              onClick={() => handlePageChange(pageNum)}
              className={cn(pageNum === pagination.page && 'bg-primary text-primary-foreground')}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
