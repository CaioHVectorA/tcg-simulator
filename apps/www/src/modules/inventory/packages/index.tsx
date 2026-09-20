"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, Book, ExternalLink, ShoppingBag, Sparkles } from "lucide-react";
import { PackageCard } from "../packages/pkg-card";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlbumView } from "../album";

export function InventoryPage({
  data: initialData,
}: {
  data: UserPackage[];
}) {
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
            <span>Mochila do Treinador</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-syne tracking-tight">
            Seu Inventário
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Abra seus boosters lacrados e acompanhe o progresso de coleção nos seus Álbuns.
          </p>
        </div>
      </div>

      <Tabs defaultValue="packages" className="mb-12">
        <TabsList className="bg-secondary/80 border border-border p-1 mb-6">
          <TabsTrigger value="packages" className="text-xs sm:text-sm font-semibold gap-2">
            <Package className="size-4 text-primary" />
            <span>Pacotes Lacrados ({data.length})</span>
          </TabsTrigger>
          <TabsTrigger value="albums" className="text-xs sm:text-sm font-semibold gap-2">
            <Book className="size-4 text-amber-500" />
            <span>Álbuns & Conquistas</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA: PACOTES LACRADOS */}
        <TabsContent value="packages" className="mt-0">
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
              <h3 className="text-xl font-bold font-syne mb-2">Nenhum pacote fechado</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                Você já abriu todos os seus pacotes ou ainda não adquiriu nenhum. Passe na loja ou colete seus bônus diários para abrir novas cartas!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-xs h-10">
                  <Link href="/loja">
                    <ShoppingBag className="size-4" /> Comprar Novos Boosters
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-semibold text-xs h-10">
                  <Link href="/colecao">
                    <Sparkles className="size-4 mr-1 text-amber-500" /> Ver Minha Coleção
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ABA: ÁLBUNS */}
        <TabsContent value="albums" className="mt-0">
          <AlbumView />
        </TabsContent>
      </Tabs>
    </div>
  );
}