"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKart } from "./use-kart";
import { useUser } from "@/context/UserContext";
import { balanceTranslate } from "@/lib/balance-translate";
import { soundFx } from "@/lib/sound-fx";
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { kart, checkout, loading } = useKart();
  const user = useUser();

  const totalCoins = kart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = kart.reduce((acc, item) => acc + item.quantity, 0);
  const userBalance = user?.money || 0;
  const hasEnoughCoins = userBalance >= totalCoins;

  const handleConfirmPurchase = async () => {
    if (!hasEnoughCoins || loading) return;
    soundFx.playCardFlip();
    // Fecha o modal imediatamente — checkout roda em background
    onOpenChange(false);
    checkout(() => {});
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!loading) onOpenChange(isOpen);
      }}
    >
      <DialogContent className="font-syne bg-card text-foreground border-border max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
              Revisão de Compra
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Confira seus itens e saldo antes de transferir para seu inventário.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de Itens & Resumo */}
        <div className="space-y-4 py-2">
          {/* Lista dos Itens */}
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
            {kart.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/70 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                    {item.type === "package" ? (
                      <Package className="size-4 text-primary" />
                    ) : (
                      <Layers className="size-4 text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-foreground truncate max-w-[170px]">
                      {item.name}
                    </h5>
                    <span className="text-[10px] text-muted-foreground">
                      {item.quantity}x {balanceTranslate(item.price)}
                    </span>
                  </div>
                </div>

                <div className="font-bold font-mono text-foreground shrink-0">
                  {balanceTranslate(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Balanço e Saldo */}
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Seu Saldo Atual:</span>
              <span className="font-mono font-bold text-foreground flex items-center gap-1">
                <Coins className="size-3 text-amber-400" />
                {balanceTranslate(userBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm font-black border-t border-border pt-2 text-foreground">
              <span>Total a Pagar ({totalItems} itens):</span>
              <span className="font-mono text-amber-500 flex items-center gap-1">
                <Coins className="size-4 fill-amber-500/20" />
                {balanceTranslate(totalCoins)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              {hasEnoughCoins ? (
                <div className="flex items-center gap-1 text-emerald-500 font-bold">
                  <CheckCircle2 className="size-3.5" />
                  <span>Saldo suficiente para esta compra.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-500 font-bold">
                  <AlertCircle className="size-3.5" />
                  <span>Saldo insuficiente. Faltam {balanceTranslate(totalCoins - userBalance)}.</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-1/3 h-11 text-xs font-bold"
            >
              {t("common.back")}
            </Button>

            <Button
              onClick={handleConfirmPurchase}
              disabled={!hasEnoughCoins || loading}
              className="flex-1 h-11 text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-1.5"
            >
              <span>{t("store.confirmBuy")}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
