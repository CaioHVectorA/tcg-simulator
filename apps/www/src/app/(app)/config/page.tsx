"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { soundFx } from "@/lib/sound-fx";
import {
  Settings,
  Moon,
  Sun,
  Laptop,
  Volume2,
  VolumeX,
  LogOut,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

export default function ConfigPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { username, email } = useUser();

  useEffect(() => {
    setMounted(true);
    setSoundEnabled(soundFx.isEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playRareChime();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl font-syne">
      <div className="mb-8 pb-4 border-b border-border">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1.5">
          <Settings className="size-3.5" />
          <span>Preferências</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configurações da Conta
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Personalize seu tema visual, sons e opções de acesso.
        </p>
      </div>

      <div className="space-y-6">
        {/* Seção 1: Tema Visual */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-1">Tema da Interface</h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Escolha como prefere visualizar o Pokémon TCG Simulator.
          </p>

          {mounted && (
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setTheme("light")}
                className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-xs ${
                  theme === "light" ? "border-primary bg-primary/10 text-primary font-bold" : ""
                }`}
              >
                <Sun className="size-5" />
                <span>Claro</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setTheme("dark")}
                className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-xs ${
                  theme === "dark" ? "border-primary bg-primary/10 text-primary font-bold" : ""
                }`}
              >
                <Moon className="size-5" />
                <span>Escuro</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setTheme("system")}
                className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-xs ${
                  theme === "system" ? "border-primary bg-primary/10 text-primary font-bold" : ""
                }`}
              >
                <Laptop className="size-5" />
                <span>Sistema</span>
              </Button>
            </div>
          )}
        </div>

        {/* Seção 2: Áudio & Efeitos */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground mb-0.5">Efeitos Sonoros</h2>
            <p className="text-xs text-muted-foreground font-sans">
              Sons sintetizados ao abrir boosters, virar cartas e encontrar lendárias.
            </p>
          </div>

          <Button
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleSound}
            className="rounded-xl h-10 px-4 text-xs font-bold gap-2"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4" /> Ativado
              </>
            ) : (
              <>
                <VolumeX className="size-4" /> Mudo
              </>
            )}
          </Button>
        </div>

        {/* Seção 3: Conta & Sessão */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-1">Informações da Conta</h2>
          <div className="font-sans text-xs text-muted-foreground space-y-1 mb-4">
            <p>Treinador: <b className="text-foreground font-syne">{username}</b></p>
            <p>Email: <b className="text-foreground">{email}</b></p>
          </div>

          <div className="pt-3 border-t border-border/60">
            <Button
              asChild
              variant="destructive"
              className="rounded-xl text-xs h-10 font-bold w-full sm:w-auto"
            >
              <Link href="/sair">
                <LogOut className="size-4 mr-2" /> Encerrar Sessão
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
