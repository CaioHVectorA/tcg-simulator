"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { PackCard } from './pack-card'
import { FlashSaleCard } from "./flash-sale-card"
import { Navigation } from "./navigation"
import { KartProvider } from "./use-kart"
import { KartFloating } from "./kart-floating"
import { useApi } from "@/hooks/use-api"
import { useFetch } from "@/hooks/use-fetch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Timer } from "@/modules/timer"
import { Gift, Zap, Package as PackageIcon, Sparkles, Coins, ShoppingBag, Clock } from "lucide-react"
import { balanceTranslate } from "@/lib/balance-translate"

type Package = {
    price: number
    name: string
    id: number
    tcg_id?: string
    image_url: string
}

type Promotional = {
    card_id: number
    id: number
    price: number
    created_at: string
    updated_at: string
    original_price: number
    card: {
        name: string
        rarity: number
        image_url: string
    }
}

import { RewardModal } from "@/components/ui/reward-modal"

export function StorePage({ data: { standard, tematics, promotionalCards } }: {
    data: {
        standard: Package[]
        tematics: Package[],
        promotionalCards: Promotional[]
    }
}) {
    const { data, loading, setData } = useFetch('/store/bought-promotional/') as unknown as { data: number[], loading: boolean, setData: React.Dispatch<React.SetStateAction<number[]>> }
    const isInPurchased = (id: number) => data?.includes(id) ?? false

    return (
        <KartProvider setData={setData}>
            <div className="min-h-screen bg-background font-syne pb-28 w-full overflow-x-hidden">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 max-w-7xl w-full">
                    <Navigation />

                    {/* Store Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-border">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1.5">
                                <ShoppingBag className="size-3.5" />
                                <span>Loja TCG</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                Loja de Pacotes & Cartas
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 max-w-xl">
                                Adquira booster packs clássicos, lootboxes temáticas e garanta cartas em oferta para turbinar seu deck.
                            </p>
                        </div>
                    </div>

                    {/* Flash Sale Cards */}
                    {!loading && data && promotionalCards && promotionalCards.length > 0 && (
                        <section id="flashcards" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Zap className="size-4 sm:size-5 text-amber-500 shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Promoções de Hoje</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">Descontos especiais em cartas selecionadas</p>
                                </div>
                            </div>

                            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
                                {promotionalCards.map((card, index) => (
                                    <FlashSaleCard isPurchased={isInPurchased(card.card_id)} key={card.id || index} card={card} />
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Pacotes Padrão */}
                    {(() => {
                        const specialPacks = standard?.filter(p => 
                            p.name.toLowerCase().includes("mítico") || 
                            p.name.toLowerCase().includes("mitico") || 
                            p.name.toLowerCase().includes("celestial") || 
                            p.name.toLowerCase().includes("vórtice") || 
                            p.name.toLowerCase().includes("vortice") || 
                            p.name.toLowerCase().includes("sombrio")
                        ) || [];
                        const otherStandardPacks = standard?.filter(p => !specialPacks.some(sp => sp.id === p.id)) || [];

                        return (
                            <>
                                {/* 1. Standard Packs */}
                                {otherStandardPacks.length > 0 && (
                                    <section id="standard" className="mb-10 sm:mb-12 scroll-mt-20">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                            <PackageIcon className="size-4 sm:size-5 text-primary shrink-0" />
                                            <div>
                                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Pacotes Padrão</h2>
                                                <p className="text-[11px] sm:text-xs text-muted-foreground">Booster packs clássicos ({otherStandardPacks.length} disponíveis)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                                            {otherStandardPacks.map((pack, index) => (
                                                <PackCard key={pack.id || index} pack={pack} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 2. Themed Packs / Lootbox */}
                                {tematics && tematics.length > 0 && (
                                    <section id="themed" className="mb-12 sm:mb-16 scroll-mt-20">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                            <Sparkles className="size-4 sm:size-5 text-purple-400 shrink-0" />
                                            <div>
                                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Pacotes Temáticos (Lootbox)</h2>
                                                <p className="text-[11px] sm:text-xs text-muted-foreground">Deposite a quantia de ouro desejada • Sorte proporcional e proteção contra cartas repetidas!</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                                            {tematics.map((pack, index) => (
                                                <PackCard withDialog key={pack.id || index} pack={pack} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 3. 2 Boosters Mais Fortes / Definitivos no Fundo (Roubadinhos) */}
                                {specialPacks.length > 0 && (
                                    <section id="special-packs" className="mb-12 sm:mb-16 scroll-mt-20">
                                        <div className="p-5 sm:p-8 rounded-3xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-purple-950/40 to-[#0c0d15] shadow-2xl relative overflow-hidden backdrop-blur-md">
                                            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
                                                <div>
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs mb-2 shadow-md">
                                                        <Sparkles className="size-3.5" />
                                                        <span>EDIÇÃO DEFINITIVA • OS MAIS ROUBADOS</span>
                                                    </div>
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground">
                                                        ⚡ Boosters Supremos Definitivos
                                                    </h2>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
                                                        Os dois boosters mais fortes e cobiçados do simulador. Taxas elevadíssimas de cartas místicas, lendárias e god pulls!
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-6 sm:gap-8 justify-center relative z-10">
                                                {specialPacks.map((pack, index) => (
                                                    <div key={pack.id || index} className="transform hover:scale-[1.03] transition-transform duration-300">
                                                        <PackCard pack={pack} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </>
                        );
                    })()}
                </div>

                <KartFloating />
            </div>
        </KartProvider>
    )
}