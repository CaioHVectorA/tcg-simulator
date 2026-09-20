import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColecaoLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne">
      <div className="container mx-auto px-4 max-w-7xl space-y-6 animate-pulse">
        <div className="h-10 w-56 bg-muted/60 rounded-xl" />
        <div className="h-14 w-full bg-muted/60 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-2 space-y-2">
              <Skeleton className="aspect-[2.5/3.5] rounded-xl w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
