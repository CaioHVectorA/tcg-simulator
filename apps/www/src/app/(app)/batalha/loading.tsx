import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, Shield } from "lucide-react";

export default function BattleLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Hero Banner Skeleton */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-10 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Swords className="size-3.5" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-10 sm:h-12 w-72 sm:w-96 rounded-2xl" />
              <Skeleton className="h-4 w-80 sm:w-[480px] rounded-lg" />
            </div>

            {/* Metrics Badges */}
            <div className="flex flex-wrap md:flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2.5 bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-sm w-36">
                <Shield className="size-5 text-indigo-500" />
                <div className="space-y-1">
                  <Skeleton className="h-2 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-sm w-36">
                <Skeleton className="size-5 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-2 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex gap-2 p-1 rounded-2xl bg-secondary/80 border border-border/60 max-w-md">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>

        {/* 3 Lanes Arena Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((lane) => (
            <div
              key={lane}
              className="bg-card border border-border/80 rounded-3xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* 2 Card Slots */}
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((slot) => (
                  <div
                    key={slot}
                    className="aspect-[2.5/3.6] rounded-2xl border-2 border-dashed border-border/60 bg-secondary/20 p-2 flex flex-col justify-between"
                  >
                    <Skeleton className="w-full flex-1 rounded-xl mb-2" />
                    <Skeleton className="h-3 w-3/4 mx-auto rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
