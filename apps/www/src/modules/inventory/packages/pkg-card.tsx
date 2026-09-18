"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { useState } from "react";
import { PackOpeningModal } from "@/components/pack-opening-modal";
import { Sparkles } from "lucide-react";

export function PackageCard({ pack }: { pack: UserPackage }) {
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);

  return (
    <>
      <Card className="relative overflow-hidden border-border/80 bg-card hover:border-amber-400/50 transition-all duration-300 shadow-md hover:shadow-xl font-syne group">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold truncate">{pack.name}</CardTitle>
        </CardHeader>

        <CardContent className="pb-3">
          {!pack.tcg_id ? (
            <div className="py-4 px-6 text-white aspect-[1/1.4] bg-slate-900 rounded-xl flex flex-col justify-between border border-amber-500/30">
              <h3 className="text-2xl font-bold">{pack.name}</h3>
              <p className="text-xs text-slate-400">{pack.description}</p>
            </div>
          ) : (
            <div className="relative aspect-[1/1.4] rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <img
                src={loadTcgImg(pack.image_url)}
                alt={pack.name}
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={() => setIsOpeningModalOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10"
          >
            <Sparkles className="size-4 mr-2" /> Abrir Pacote
          </Button>
        </CardFooter>

        {/* Badge com Quantidade de Pacotes Disponíveis */}
        <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 border-2 border-background shadow-lg rounded-full px-2.5 py-0.5 text-xs font-mono font-black flex items-center justify-center">
          {pack.quantity}x
        </div>
      </Card>

      {/* Modal Interativo de Abertura */}
      <PackOpeningModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        pack={pack}
        initialQuantity={pack.quantity}
      />
    </>
  );
}