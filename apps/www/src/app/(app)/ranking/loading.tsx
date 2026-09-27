import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

export default function RankingLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
              <Trophy className="size-3.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 p-1 rounded-2xl bg-secondary/80 border border-border/60 max-w-sm">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>

        {/* Ranking List Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="size-11 rounded-2xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
