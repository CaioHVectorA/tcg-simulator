"use client";

import React from "react";
import { Package, ShoppingBag, Sparkles } from "lucide-react";
import { PackageCard } from "../packages/pkg-card";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/i18n/LanguageContext";

export function InventoryPage({
  data: initialData,
}: {
  data: UserPackage[];
}) {
  const { t } = useTranslation();
  const { get } = useApi();
  const { data = [] } = useQuery<UserPackage[]>({
    initialData,
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await get("/packages");
      return res.data.data ?? res.data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl">
      {/* Cabeçalho do Inventário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold mb-2">
            <Package className="size-3.5 text-primary" />
            <span>{t("inventory.trainerBackpack")}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-syne tracking-tight">
            {t("inventory.title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("inventory.subtitle")}
          </p>
        </div>
      </div>

      <div className="mb-12">
        {data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {data.map((pack, index) => (
              <PackageCard key={pack.id + index} pack={pack} />
            ))}
          </div>
        ) : (
          /* EMPTY STATE APRIMORADO PARA 0 PACOTES */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto border border-dashed border-border/80 rounded-2xl bg-card/40 my-4">
            <div className="size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Package className="size-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-syne mb-2">{t("inventory.emptyTitle")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
              {t("inventory.emptyDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-xs h-10">
                <Link href="/loja">
                  <ShoppingBag className="size-4" /> {t("inventory.buyNewBoosters")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-semibold text-xs h-10">
                <Link href="/colecao">
                  <Sparkles className="size-4 mr-1 text-amber-500" /> {t("inventory.viewCollectionAlbums")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}