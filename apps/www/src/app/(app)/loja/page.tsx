"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { StorePage } from "./store";
import { StoreSkeleton } from "./store-skeleton";

export default function Loja() {
  const { get } = useApi();
  const { data, isLoading } = useQuery({
    queryKey: ["store-data"],
    queryFn: async () => {
      const res = await get("/store/data");
      return res.data.data ?? res.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return <StoreSkeleton />;
  }

  return <StorePage data={data} />;
}