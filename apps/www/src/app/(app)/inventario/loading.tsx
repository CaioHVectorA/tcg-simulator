import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Sparkles } from "lucide-react";

export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase">
              <Package className="size-3.5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Booster Packs Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-[1/1.4] w-full rounded-2xl overflow-hidden bg-secondary/40">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
