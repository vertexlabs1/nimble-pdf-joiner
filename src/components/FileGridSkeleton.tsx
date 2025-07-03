import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface FileGridSkeletonProps {
  count?: number;
  viewMode: 'grid' | 'list';
}

export default function FileGridSkeleton({ count = 8, viewMode }: FileGridSkeletonProps) {
  const skeletonItems = Array.from({ length: count }, (_, i) => i);

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {skeletonItems.map((i) => (
          <div key={i} className="p-3 rounded-lg border border-transparent">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-13 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
      {skeletonItems.map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-50 h-65 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}