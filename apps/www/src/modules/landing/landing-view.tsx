"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoosterPackArt } from "@/components/booster-pack-art";
import { soundFx } from "@/lib/sound-fx";
import {
  Sparkles,
  ArrowRight,
  Gift,
  ShieldCheck,
  Users,
  Repeat,
  Flame,
  Trophy,
  Compass,
  Zap,
} from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

interface LandingViewProps {
  isLoggedIn: boolean;
}

const FEATURE_CARDS = [
  {
    icon: Flame,
    title: "Abertura Imersiva",
    badge: "God Pulls & Áudio",
    desc: "Rasgue boosters com física realista, revelação progressiva e efeitos vibrantes para cartas de raridade máxima.",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "hover:border-amber-500/50",
    iconColor: "text-amber-400",
  },
  {
    icon: Repeat,
    title: "Mercado de Trocas",
    badge: "Entre Treinadores",
    desc: "Negocie com outros treinadores da comunidade, publique suas cartas repetidas e complete sua coleção.",
    accent: "from-sky-500/20 to-blue-500/10",
    border: "hover:border-sky-500/50",
    iconColor: "text-sky-400",
  },
  {
    icon: Users,
    title: "Social & Amigos",
    badge: "Tempo Real",
    desc: "Adicione amigos, acompanhe quem está online, envie presentes diários de moedas e converse no chat.",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/50",
    iconColor: "text-emerald-400",
  },
  {
    icon: Trophy,
    title: "Rankings & Conquistas",
    badge: "Competitivo",
    desc: "Acumule pontos ao colecionar cartas raras e dispute as melhores posições no ranking de colecionadores.",
    accent: "from-purple-500/20 to-fuchsia-500/10",
    border: "hover:border-purple-500/50",
    iconColor: "text-purple-400",
  },
];

const SHOWCASE_CARDS = [
  {
    name: "Charizard Base Set",
    img: "https://assets.tcgdex.net/pt/base/base1/4/high.webp",
    rarity: "★★★★★",
    badge: "Lendária",
    accent: "shadow-amber-500/30 border-amber-500/60",
    rotation: -14,
    yOffset: 20,
  },
  {
    name: "Pikachu Illustrator / VMAX",
    img: "https://assets.tcgdex.net/pt/swsh/swsh4/44/high.webp",
    rarity: "★★★★☆",
    badge: "Mística",
    accent: "shadow-yellow-500/40 border-yellow-400/80",
    rotation: 0,
    yOffset: -15,
  },
  {
    name: "Mewtwo GX Secreto",
    img: "https://assets.tcgdex.net/pt/sm/sm35/78/high.webp",
    rarity: "★★★★★",
    badge: "God Pull",
    accent: "shadow-purple-500/30 border-purple-500/60",
    rotation: 14,
    yOffset: 20,
  },
];

export function LandingView({ isLoggedIn }: LandingViewProps) {
  const [activePack, setActivePack] = useState("Pacote lendário");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Neon Light Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-150px] w-[500px] h-[500px] bg-sky-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[60%] left-[-150px] w-[500px] h-[500px] bg-rose-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Header Fixo Transparente */}
      <header className="w-full border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50 transition-all">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 sm:size-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="size-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="font-syne font-bold text-lg sm:text-xl tracking-tight text-foreground block">
                SimTCG
              </span>
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-muted-foreground block -mt-0.5">
                Pokémon Simulator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans shadow-md shadow-amber-500/20">
                <Link href="/home">
                  Entrar no Jogo <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" asChild className="font-sans text-xs sm:text-sm font-semibold">
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-xs sm:text-sm px-4 shadow-md shadow-amber-500/20">
                  <Link href="/entrar">
                    Jogar Agora <Sparkles className="size-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION TÁTIL */}
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-12 sm:pt-20 pb-16 sm:pb-24 flex flex-col items-center text-center relative">
          {/* Badge de Anúncio */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/80 backdrop-blur-xs text-xs font-semibold text-foreground mb-6 shadow-xs">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Simulador Pokémon TCG</span>
            </div>
          </motion.div>

          {/* Headline Impactante */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-syne text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-4xl text-foreground leading-[1.12]"
          >
            Abra Pacotes. <br className="hidden sm:inline" />
            Colecione Lendárias. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Domine as Trocas.
            </span>
          </motion.h1>

          {/* Subtítulo Legível */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-sans text-sm sm:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed"
          >
            Abra boosters, descubra cartas secretas e monte sua coleção completa com milhares de cartas oficiais do universo Pokémon.
          </motion.p>

          {/* CTAs Táteis */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md justify-center"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-base rounded-xl shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
              onClick={() => soundFx.playSuccess()}
            >
              <Link href={isLoggedIn ? "/home" : "/entrar"}>
                <Zap className="size-5 mr-2 fill-slate-950" />
                {isLoggedIn ? "Acessar Simulador" : "Jogar Imediatamente (Grátis)"}
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 font-sans font-semibold text-sm sm:text-base border-border/80 hover:bg-secondary/60 rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Link href="/entrar">
                <Sparkles className="size-4 mr-2 text-amber-500" />
                Criar Coleção Grátis
              </Link>
            </Button>
          </motion.div>

          {/* SHOWCASE VISUAL: LEQUE DE CARTAS HOLOGRÁFICAS E BOOSTER PACK TÁTIL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 sm:mt-20 w-full max-w-5xl relative"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card/40 border border-border/60 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/30">
              {/* Coluna da Esquerda: Leque 3D de Cartas Raras */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Cartas Oficiais TCGdex em Alta Resolução
                </span>

                <div className="relative h-72 sm:h-80 w-full max-w-md flex items-center justify-center">
                  {SHOWCASE_CARDS.map((card, idx) => (
                    <motion.div
                      key={card.name}
                      whileHover={{ scale: 1.15, zIndex: 40, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`absolute w-44 sm:w-52 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl border-2 ${card.accent} cursor-pointer transition-all duration-300`}
                      style={{
                        transform: `rotate(${card.rotation}deg) translateY(${card.yOffset}px)`,
                        zIndex: idx === 1 ? 30 : 20,
                      }}
                      onMouseEnter={() => soundFx.playCardFlip()}
                    >
                      <img
                        src={card.img}
                        alt={card.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs border border-white/10 rounded-lg p-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-300">
                          {card.badge}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {card.rarity}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Coluna da Direita: Pacote Interativo com BoosterPackArt */}
              <div className="lg:col-span-5 flex flex-col items-center text-center p-4 border-t lg:border-t-0 lg:border-l border-border/40">
                <span className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-2 font-bold">
                  Demonstração de Pacote Booster
                </span>
                <h3 className="font-syne text-xl font-bold text-foreground mb-4">
                  {activePack}
                </h3>

                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-48 sm:w-56 cursor-pointer mb-4"
                  onMouseEnter={() => soundFx.playRareChime()}
                >
                  <BoosterPackArt name={activePack} cardsQuantity={8} />
                </motion.div>

                {/* Seletor Rápido de Temas de Pacote */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {["Pacote simples", "Pacote raro", "Grande pacote", "Pacote lendário"].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setActivePack(theme);
                        soundFx.playCardFlip();
                      }}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                        activePack === theme
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-muted/60 text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* RECURSOS & FUNCIONALIDADES MODERNAS */}
        <section className="container mx-auto px-4 py-16 sm:py-24 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <Badge variant="outline" className="mb-3 font-mono text-xs text-primary border-primary/30">
              Experiência Completa
            </Badge>
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Tudo o que um Treinador Precisa
            </h2>
            <p className="text-muted-foreground font-sans text-sm sm:text-base mt-2">
              Tudo o que você precisa para colecionar, abrir pacotes e interagir com outros treinadores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`bg-card/60 backdrop-blur-xs border border-border/80 rounded-2xl p-6 transition-all duration-300 ${feat.border} flex flex-col justify-between hover:shadow-xl hover:-translate-y-1`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-muted border border-border ${feat.iconColor}`}>
                        <Icon className="size-6" />
                      </div>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {feat.badge}
                      </Badge>
                    </div>

                    <h3 className="font-syne text-lg font-bold text-foreground mb-2">
                      {feat.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAIXA DE BENEFÍCIOS & CALL TO ACTION */}
        <section className="container mx-auto px-4 py-12 mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-sky-500/15 border border-amber-500/30 p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-md">
            <div className="max-w-2xl mx-auto">
              <span className="text-3xl sm:text-4xl mb-3 block">🎁</span>
              <h2 className="font-syne text-2xl sm:text-4xl font-black text-foreground mb-3">
                Comece sua jornada com Boosters Gratuitos
              </h2>
              <p className="font-sans text-xs sm:text-base text-muted-foreground mb-8">
                Crie sua conta em menos de 1 minuto ou jogue diretamente como convidado para abrir pacotes e começar sua coleção lendária!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-syne rounded-xl shadow-lg shadow-amber-500/20"
                >
                  <Link href="/entrar">
                    Jogar Agora Gratuitamente <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 font-syne font-semibold rounded-xl"
                >
                  <Link href="/entrar">Entrar sem Cadastro</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER ELEGANTE */}
      <footer className="border-t border-border/40 bg-card/40 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-sans">
          <div className="flex items-center gap-2">
            <span className="font-syne font-bold text-foreground">SimTCG</span>
            <span>• Pokémon TCG Simulator</span>
            <span>• Feito por fãs e treinadores</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/CaioHVectorA/tcg-simulator"
              target="_blank"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <GitHubLogoIcon className="size-4" />
              <span>Código Aberto no GitHub</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
