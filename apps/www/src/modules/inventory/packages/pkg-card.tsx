"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { useState } from "react";
import { PackOpeningModal } from "@/components/pack-opening-modal";
import { BatchOpeningModal } from "@/components/batch-opening-modal";
import { BoosterPackArt } from "@/components/booster-pack-art";
import { Sparkles, Layers } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export function PackageCard({ pack }: { pack: UserPackage }) {
  const { t } = useTranslation();
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isBatchSelectorOpen, setIsBatchSelectorOpen] = useState(false);
  const [isBatchOpeningOpen, setIsBatchOpeningOpen] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState(1);

  const isStandardPack = !pack.tcg_id || !pack.image_url || pack.image_url.includes("placeholder");
  const hasMultiple = pack.quantity > 1;

  const handleOpenBatch = (qty: number) => {
    setBatchQuantity(Math.min(qty, pack.quantity));
    setIsBatchSelectorOpen(false);
    setIsBatchOpeningOpen(true);
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border/80 bg-card hover:border-amber-400/50 transition-all duration-300 shadow-md hover:shadow-xl font-syne group flex flex-col justify-between">
        <div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold truncate">{pack.name}</CardTitle>
          </CardHeader>

          <CardContent className="pb-3">
            {isStandardPack ? (
              <div className="relative aspect-[1/1.4] rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <BoosterPackArt name={pack.name} cardsQuantity={pack.cards_quantity} />
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
        </div>

        <CardFooter className="pt-0 flex flex-col gap-2">
          {hasMultiple ? (
            <div className="flex items-center gap-2 w-full">
              <Button
                onClick={() => setIsOpeningModalOpen(true)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs h-10"
              >
                <Sparkles className="size-3.5 mr-1 text-amber-500" /> {t("inventory.openOne")}
              </Button>

              <Button
                onClick={() => setIsBatchSelectorOpen(true)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs h-10 shadow-md shadow-amber-500/10"
              >
                <Layers className="size-3.5 mr-1" /> {t("inventory.openMany")}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsOpeningModalOpen(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10 h-10 text-xs"
            >
              <Sparkles className="size-4 mr-2" /> {t("inventory.openPack")}
            </Button>
          )}
        </CardFooter>

        {/* Badge com Quantidade de Pacotes Disponíveis */}
        <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 border-2 border-background shadow-lg rounded-full px-2.5 py-0.5 text-xs font-mono font-black flex items-center justify-center">
          {pack.quantity}x
        </div>
      </Card>

      {/* Modal Seletor de Quantidade em Lote */}
      <Dialog open={isBatchSelectorOpen} onOpenChange={setIsBatchSelectorOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border font-syne p-6 rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Layers className="size-5 text-amber-500" />
              <span>{t("inventory.openBatch", { name: pack.name })}</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground font-sans mt-1 mb-4">
            {t("inventory.youHave", { qty: pack.quantity })} {t("inventory.chooseQuantity")}
          </p>

          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {pack.quantity >= 2 && (
              <Button
                variant="outline"
                onClick={() => handleOpenBatch(2)}
                className="h-12 text-xs font-bold border-border hover:border-amber-500/60"
              >
                {t("inventory.openQtyCards", { qty: 2, cards: 2 * (pack.cards_quantity || 5) })}
              </Button>
            )}
            {pack.quantity >= 5 && (
              <Button
                variant="outline"
                onClick={() => handleOpenBatch(5)}
                className="h-12 text-xs font-bold border-border hover:border-amber-500/60"
              >
                {t("inventory.openQtyCards", { qty: 5, cards: 5 * (pack.cards_quantity || 5) })}
              </Button>
            )}
            {pack.quantity >= 10 && (
              <Button
                variant="outline"
                onClick={() => handleOpenBatch(10)}
                className="h-12 text-xs font-bold border-border hover:border-amber-500/60"
              >
                {t("inventory.openQtyCards", { qty: 10, cards: 10 * (pack.cards_quantity || 5) })}
              </Button>
            )}
            <Button
              onClick={() => handleOpenBatch(pack.quantity)}
              className="h-12 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 col-span-2 shadow-md shadow-amber-500/20"
            >
              {t("inventory.openAllCards", {
                qty: pack.quantity,
                cards: pack.quantity * (pack.cards_quantity || 5),
              })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Individual de Abertura */}
      <PackOpeningModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        pack={pack}
        initialQuantity={pack.quantity}
      />

      {/* Modal de Abertura em Massa */}
      <BatchOpeningModal
        isOpen={isBatchOpeningOpen}
        onClose={() => setIsBatchOpeningOpen(false)}
        pack={pack}
        quantityToOpen={batchQuantity}
      />
    </>
  );
}