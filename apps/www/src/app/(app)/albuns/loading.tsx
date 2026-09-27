import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export default function AlbumsLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
              <BookOpen className="size-3.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-9 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Albums Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-3xl p-6 space-y-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>

              {/* Mini card slots */}
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }).map((_, cIdx) => (
                  <Skeleton key={cIdx} className="aspect-[2.5/3.5] rounded-lg" />
                ))}
              </div>

              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
