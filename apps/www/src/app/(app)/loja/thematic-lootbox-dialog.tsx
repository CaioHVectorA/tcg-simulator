"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import { useApi } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { balanceTranslate } from "@/lib/balance-translate";
import { loadTcgImg } from "@/lib/load-tcg-img";
import {
  Sparkles,
  Coins,
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { LoaderSimple } from "@/components/loading-spinner";
import { PackOpeningModal } from "@/components/pack-opening-modal";

type ThematicLootboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pack: {
    id: number;
    name: string;
    image_url: string;
    tcg_id?: string;
  };
};

const QUICK_CHIPS = [500, 1000, 2500, 5000, 10000];

export function ThematicLootboxDialog({
  open,
  onOpenChange,
  pack,
}: ThematicLootboxDialogProps) {
  const user = useUser();
  const userMoney = user?.money || 0;
  const { post, loading } = useApi();
  const qClient = useQueryClient();

  const [goldAmount, setGoldAmount] = useState<number>(1000);
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [openedCards, setOpenedCards] = useState<any[]>([]);

  // Estimativa de cartas
  const estimatedCards = Math.min(15, Math.max(3, Math.floor(Math.sqrt(goldAmount / 50)) + 1));
  const luckBonus = Math.min(100, Math.round((goldAmount / 10000) * 100));

  const handleOpenLootbox = async () => {
    if (goldAmount < 500 || goldAmount > userMoney) return;

    try {
      const res = await post("/packages/thematic-lootbox", {
        packageId: pack.id,
        goldAmount,
      });

      if (res.data?.data?.cards) {
        const cards = res.data.data.cards;
        setOpenedCards(cards);
        await qClient.invalidateQueries({ queryKey: ["user"] });
        await qClient.invalidateQueries({ queryKey: ["packages"] });

        // Fecha a caixa de diálogo de aposta e abre imediatamente a animação oficial de abertura!
        onOpenChange(false);
        setOpeningModalOpen(true);
      }
    } catch (err) {
      console.error("Lootbox error:", err);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground p-5 sm:p-7 rounded-2xl">
          {/* TELA DE DEPÓSITO E CONFIGURAÇÃO DA LOOTBOX */}
            <DialogHeader className="text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold font-mono mb-1 w-fit">
                <Gift className="size-3.5" />
                <span>Lootbox Temática Dinâmica</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold font-syne text-foreground flex items-center gap-2">
                <span>{pack.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Deposite quanto ouro desejar. O cálculo determina o volume de cartas e a taxa de sorte com proteção contra repetição!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 my-4">
              {/* Saldo Atual */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
                <span className="text-xs text-muted-foreground">Seu Saldo Disponível:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-sm text-foreground">
                  <Coins className="size-4 text-amber-400" />
                  <span>{balanceTranslate(userMoney)}</span>
                </div>
              </div>

              {/* Seletor de Valor em Ouro */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Depósito em Ouro:
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Coins className="size-4 text-amber-400 shrink-0" />
                    <span className="font-mono font-black text-amber-400 text-base">
                      {goldAmount.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Input Range */}
                <input
                  type="range"
                  min={500}
                  max={Math.max(500, Math.min(25000, userMoney || 25000))}
                  step={100}
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(Number(e.target.value))}
                  className="w-full accent-amber-400 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />

                {/* Chips de Atalho */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_CHIPS.map((chip) => {
                    const disabled = userMoney < chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setGoldAmount(chip);
                          soundFx.playCardFlip();
                        }}
                        className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          goldAmount === chip
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                            : disabled
                            ? "opacity-30 border-border cursor-not-allowed text-muted-foreground"
                            : "bg-secondary/80 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </button>
                    );
                  })}
                  {userMoney >= 500 && (
                    <button
                      type="button"
                      onClick={() => setGoldAmount(Math.min(25000, userMoney))}
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Estatísticas Estimadas da Lootbox */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-card/60 border border-border/80 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[11px]">Cartas Devolvidas:</span>
                  <div className="flex items-center gap-1 font-bold font-mono text-sm text-foreground">
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span>~{estimatedCards} cartas</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[11px]">Multiplicador de Sorte:</span>
                  <div className="flex items-center gap-1 font-bold font-mono text-sm text-purple-400">
                    <Zap className="size-3.5 text-purple-400" />
                    <span>+{luckBonus}% Místicas</span>
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-border/50 flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>Proteção ativa: pouca ou zero chance de cartas repetidas no lote!</span>
                </div>
              </div>
            </div>

            {/* Ação */}
            <Button
              onClick={handleOpenLootbox}
              disabled={loading || userMoney < goldAmount || goldAmount < 500}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-sm rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoaderSimple className="size-4" />
                  <span>Forjando Lootbox...</span>
                </div>
              ) : userMoney < goldAmount ? (
                <span>Saldo Insuficiente</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="size-4" />
                  <span>Depositar & Abrir Lootbox ({goldAmount.toLocaleString("pt-BR")} Ouro)</span>
                </div>
              )}
            </Button>
        </DialogContent>
      </Dialog>

      <PackOpeningModal
        isOpen={openingModalOpen}
        onClose={() => setOpeningModalOpen(false)}
        pack={{
          ...pack,
          price: goldAmount,
          cards_quantity: openedCards.length,
          quantity: 1,
        } as any}
        preloadedCards={openedCards}
      />
    </>
  );
}
