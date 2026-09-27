import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

export default function MissoesLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
              <Target className="size-3.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex gap-2 max-w-md">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>

        {/* Quests List */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3 w-72 rounded" />
                <div className="space-y-1 pt-1 max-w-md">
                  <div className="flex justify-between">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-2 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
