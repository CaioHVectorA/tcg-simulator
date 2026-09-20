import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Zap, Package as PackageIcon, Sparkles } from "lucide-react";

export function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-background font-syne pb-28 w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 max-w-7xl w-full">
        {/* Navigation Skeleton */}
        <div className="sticky top-2 sm:top-3 z-40 mx-auto max-w-full w-fit mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-xs">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>

        {/* Store Header Banner Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-border">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1">
              <ShoppingBag className="size-3.5 text-primary" />
              <span>Loja TCG</span>
            </div>
            <Skeleton className="h-9 w-64 sm:w-80 rounded-xl" />
            <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
          </div>
        </div>

        {/* Promoções Flash Skeleton */}
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Zap className="size-4 sm:size-5 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/80 bg-card p-2.5 space-y-2">
                <Skeleton className="w-full aspect-[2.5/3.5] rounded-xl" />
                <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
                <Skeleton className="h-4 w-1/2 mx-auto rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* Standard Booster Packs Skeleton (12 items) */}
        <section className="mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <PackageIcon className="size-4 sm:size-5 text-primary shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <Skeleton className="w-full h-52 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-2/3 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1 rounded-xl" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Themed Packs Skeleton */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="size-4 sm:size-5 text-purple-400 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <Skeleton className="w-full h-52 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-2/3 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
