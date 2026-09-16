"use client";

import React from "react";
import { SocialHub } from "@/modules/social/social-hub";
import { Users } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl font-syne">
      <div className="mb-6 pb-4 border-b border-border">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1.5">
          <Users className="size-3.5" />
          <span>Comunidade</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Central Social & Amigos
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Conecte-se com outros treinadores, converse em tempo real e compartilhe moedas e trocas.
        </p>
      </div>

      <div className="bg-card/50 border border-border/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
        <SocialHub />
      </div>
    </div>
  );
}
