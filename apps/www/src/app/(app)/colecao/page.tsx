"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Cards } from "@/modules/colection";
import { Skeleton } from "@/components/ui/skeleton";

function ColecaoClient() {
  const searchParams = useSearchParams();
  const { get } = useApi();

  const page = searchParams.get("page") || "1";
  const search = searchParams.get("search") || "";
  const rarity = searchParams.get("rarity") || "";
  const type = searchParams.get("type") || "";
  const favorites = searchParams.get("favorites") || "";
  const tradeOnly = searchParams.get("tradeOnly") || "";

  const queryString = searchParams.toString();

  const { data, isLoading } = useQuery({
    queryKey: ["my-cards", queryString],
    queryFn: async () => {
      const res = await get(`/cards/my?${queryString}`);
      return res.data?.data ?? res.data ?? {};
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const payload = data || {};

  return (
    <Cards
      data={payload.data || []}
      currentPage={payload.currentPage || Number(page) || 1}
      totalPages={payload.totalPages || 1}
      totalCards={payload.totalCards ?? (payload.data?.length || 0)}
      search={search}
      filters={{ page, search, rarity, type, favorites, tradeOnly }}
      isLoading={isLoading}
    />
  );
}

export default function ColecaoPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ColecaoClient />
    </Suspense>
  );
}