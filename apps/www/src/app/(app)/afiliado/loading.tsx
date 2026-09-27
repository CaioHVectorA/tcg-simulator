import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2 } from "lucide-react";

export default function AfiliadoLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Hero Card */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-500 uppercase">
            <Users2 className="size-3.5" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-10 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-36 rounded-2xl" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>

        {/* Invited Friends Table */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
