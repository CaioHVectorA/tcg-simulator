'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  RefreshCcw,
  Users,
  Trophy,
  ExternalLink,
  DollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  Target,
  Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HeaderHome } from './header-home'
import { DailyRoadSection } from './daily-road-section'
import { loadTcgImg } from '@/lib/load-tcg-img'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { LoaderSimple } from '@/components/loading-spinner'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/lib/cookies'
import { motion } from 'framer-motion'
import { soundFx } from '@/lib/sound-fx'

type HomeData = {
  banners: {
    title: string
    description: string
    image_url: string
  }[]
  topCards: string[]
  ranking: {
    position: number
    total_rarity: number
    count: number
  }
  rankingMoney: {
    position: number
    total_money: number
    count: number
  }
}

export function HomePage() {
  const { get } = useApi()
  const { refresh } = useRouter()

  const { data, isLoading } = useQuery<HomeData>({
    queryKey: ['/home'],
    queryFn: async () => {
      if (!getCookie('token')) return refresh()
      const res = await get('/home')
      return res.data.data ?? res.data
    },
    staleTime: 60 * 1000,
  })

  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3 font-sans text-muted-foreground">
        <LoaderSimple />
        <p className="text-xs">Carregando centro de treinador...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-8 max-w-6xl font-sans">
      {/* Header do Usuário */}
      <HeaderHome />

      {/* Estrada de Ganho Diário Ampliada (Daily Road) */}
      <DailyRoadSection />

      {/* Grid de Ações Rápidas do Treinador */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/loja" className="group">
          <Card className="p-4 sm:p-5 h-full border-border/80 bg-card hover:border-amber-400/60 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag className="size-5" />
              </div>
              <h4 className="font-syne font-bold text-sm sm:text-base text-foreground mb-1">
                Loja de Boosters
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Adquira pacotes com moedas e tire cartas raras.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-500 font-syne">
              <span>Explorar</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link href="/inventario" className="group">
          <Card className="p-4 sm:p-5 h-full border-border/80 bg-card hover:border-sky-400/60 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="size-5" />
              </div>
              <h4 className="font-syne font-bold text-sm sm:text-base text-foreground mb-1">
                Meus Pacotes
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Abra seus boosters guardados com animação 3D.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-sky-500 font-syne">
              <span>Abrir</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link href="/trocas" className="group">
          <Card className="p-4 sm:p-5 h-full border-border/80 bg-card hover:border-emerald-400/60 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <RefreshCcw className="size-5" />
              </div>
              <h4 className="font-syne font-bold text-sm sm:text-base text-foreground mb-1">
                Mercado de Trocas
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Crie propostas e negocie cartas com amigos.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-500 font-syne">
              <span>Negociar</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link href="/social" className="group">
          <Card className="p-4 sm:p-5 h-full border-border/80 bg-card hover:border-purple-400/60 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="size-5" />
              </div>
              <h4 className="font-syne font-bold text-sm sm:text-base text-foreground mb-1">
                Comunidade Social
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Conecte-se com amigos, converse e envie presentes.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-500 font-syne">
              <span>Conectar</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>

      {/* SEÇÃO: SEUS ÚLTIMOS TOP CARDS COM LEQUE TÁTIL */}
      <section className="bg-card/40 border border-border/70 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 mb-1">
              <Sparkles className="size-3.5" />
              <span>Destaques da Coleção</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-syne text-foreground tracking-tight">
              Seus Top Cards Mais Raros
            </h2>
          </div>

          <Button asChild variant="outline" size="sm" className="font-syne text-xs rounded-xl">
            <Link href="/inventario">Ver Coleção Completa</Link>
          </Button>
        </div>

        {data.topCards.length > 0 ? (
          <div className="flex relative items-end gap-2 sm:gap-4 justify-center py-6 sm:py-8 overflow-hidden">
            {/* Carta Esquerda */}
            {data.topCards[0] && (
              <motion.div
                whileHover={{ scale: 1.1, zIndex: 40, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rotate-[-16deg] hover:z-30 h-60 sm:h-76 mb-4 sm:mb-6 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-xl border-2 border-border/80 cursor-pointer"
                onMouseEnter={() => soundFx.playCardFlip()}
              >
                <img
                  className="w-full h-full object-cover"
                  src={loadTcgImg(data.topCards[0])}
                  alt="Top Card 1"
                />
              </motion.div>
            )}

            {/* Carta Central em Destaque */}
            {data.topCards[1] ? (
              <motion.div
                whileHover={{ scale: 1.12, zIndex: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-72 sm:h-88 -mx-8 sm:-mx-12 hover:z-30 z-20 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/80 shadow-amber-500/20 cursor-pointer"
                onMouseEnter={() => soundFx.playRareChime()}
              >
                <img
                  className="w-full h-full object-cover"
                  src={loadTcgImg(data.topCards[1])}
                  alt="Top Card 2"
                />
              </motion.div>
            ) : data.topCards[0] ? null : null}

            {/* Carta Direita */}
            {data.topCards[2] && (
              <motion.div
                whileHover={{ scale: 1.1, zIndex: 40, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rotate-[16deg] hover:z-30 h-60 sm:h-76 mb-4 sm:mb-6 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-xl border-2 border-border/80 cursor-pointer"
                onMouseEnter={() => soundFx.playCardFlip()}
              >
                <img
                  className="w-full h-full object-cover"
                  src={loadTcgImg(data.topCards[2])}
                  alt="Top Card 3"
                />
              </motion.div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="size-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mb-3 text-muted-foreground">
              <Package className="size-8" />
            </div>
            <h3 className="text-xl font-bold font-syne text-foreground mb-1">
              Sua pasta de cartas ainda está vazia!
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-4">
              Vá para a loja, adquira seus primeiros boosters e comece sua jornada para tirar uma God Pull.
            </p>
            <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold font-syne text-xs px-6 h-10 rounded-xl">
              <Link href="/loja">
                <ShoppingBag className="size-4 mr-1.5" /> Ir para a Loja
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* SEÇÃO: RANKINGS (COLECIONADORES E MAGNATAS) COM CONTRASTE REFINADO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Ranking de Colecionadores */}
        <Card className="rounded-3xl border border-border/80 bg-card p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-foreground">
                    Ranking de Colecionadores
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Pontos de Raridade de Cartas
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-500 bg-amber-500/10">
                #{data.ranking.position} Lugar
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block">Pontuação Total</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                  {data.ranking.total_rarity.toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Sua Posição</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-500">
                  Top {Math.max(1, Math.round((data.ranking.position / Math.max(1, data.ranking.count)) * 100))}%
                </span>
              </div>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full mt-2 font-syne font-bold text-xs h-10 rounded-xl">
            <Link href="/ranking">
              Ver Classificação Completa <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>

        {/* Card: Ranking de Magnatas */}
        <Card className="rounded-3xl border border-border/80 bg-card p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-foreground">
                    Ranking dos Magnatas
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Economia e Fortuna Acumulada
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-500 bg-emerald-500/10">
                #{data.rankingMoney.position} Lugar
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block">Fortuna em Moedas</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                  {data.rankingMoney.total_money.toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Sua Posição</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-500">
                  Top {Math.max(1, Math.round((data.rankingMoney.position / Math.max(1, data.rankingMoney.count)) * 100))}%
                </span>
              </div>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full mt-2 font-syne font-bold text-xs h-10 rounded-xl">
            <Link href="/ranking">
              Ver Classificação Completa <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  )
}