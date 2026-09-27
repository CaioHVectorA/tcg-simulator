import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "lucide-react";

export default function ConfigLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne animate-pulse">
      <div className="container mx-auto px-4 max-w-3xl space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold uppercase">
            <Settings className="size-3.5 text-muted-foreground" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl border border-border bg-card space-y-4">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
