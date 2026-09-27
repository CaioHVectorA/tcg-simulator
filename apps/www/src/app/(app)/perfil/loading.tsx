import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

export default function PerfilLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Profile Card Header Skeleton */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <Skeleton className="size-24 sm:size-28 rounded-3xl shrink-0" />
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <Skeleton className="h-8 w-48 rounded-xl mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-64 rounded-md mx-auto sm:mx-0" />
            <div className="flex gap-2 justify-center sm:justify-start">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          ))}
        </div>

        {/* Level Progression Road */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-5 gap-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <Skeleton className="size-10 rounded-xl mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
