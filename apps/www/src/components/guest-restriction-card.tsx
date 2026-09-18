"use client";

import React, { useState } from "react";
import { Lock, Sparkles, ShieldCheck, ArrowRight, Gift, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeAccountModal } from "@/components/upgrade-account-modal";

interface GuestRestrictionCardProps {
  featureTitle?: string;
  description?: string;
}

export function GuestRestrictionCard({
  featureTitle = "Área Social e Interativa",
  description = "Contas de visitante possuem acesso de visualização, mas funcionalidades sociais e de trocas diretas requerem uma conta registrada para prevenir abusos.",
}: GuestRestrictionCardProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-background to-background p-6 sm:p-8 text-center shadow-lg">
        {/* Glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <div className="size-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-inner mb-4">
            <Lock className="size-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 mb-3">
            <Sparkles className="size-3.5" /> Modo Convidado
          </span>

          <h3 className="text-2xl font-bold font-syne text-foreground mb-2">
            Desbloqueie {featureTitle}
          </h3>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {description}
          </p>

          <div className="w-full bg-card/70 border border-border/80 rounded-xl p-4 mb-6 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-foreground">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <span>Você <strong>mantém todo seu progresso</strong>, cartas e moedas.</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground">
              <Users className="size-4 text-sky-500 shrink-0" />
              <span>Adicione amigos, converse no chat e veja status online.</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground">
              <RefreshCw className="size-4 text-purple-500 shrink-0" />
              <span>Negocie cartas no mercado global de trocas livremente.</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => setUpgradeOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Aprimorar Minha Conta Gratuitamente</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <UpgradeAccountModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
