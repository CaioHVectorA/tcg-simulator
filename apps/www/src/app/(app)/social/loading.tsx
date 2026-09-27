import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export default function SocialLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase">
            <Users className="size-3.5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>

        {/* Tabs Bar */}
        <div className="grid grid-cols-4 gap-2 p-1 rounded-xl bg-accent/50 h-11">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>

        {/* Search Input */}
        <Skeleton className="h-10 w-full rounded-xl" />

        {/* Friends List */}
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
