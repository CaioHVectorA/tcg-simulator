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
import { useTranslation } from "@/i18n/LanguageContext"

export function StorePage({ data: { standard, tematics, promotionalCards } }: {
    data: {
        standard: Package[]
        tematics: Package[],
        promotionalCards: Promotional[]
    }
}) {
    const { t } = useTranslation()
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
                                <span>{t("nav.store")}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                {t("store.title")}
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 max-w-xl">
                                {t("store.subtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Flash Sale Cards */}
                    {!loading && data && promotionalCards && promotionalCards.length > 0 && (
                        <section id="flashcards" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Zap className="size-4 sm:size-5 text-amber-500 shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("store.flashSale")}</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">{t("store.subtitle")}</p>
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
                    {standard && standard.length > 0 && (
                        <section id="standard" className="mb-10 sm:mb-12 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <PackageIcon className="size-4 sm:size-5 text-primary shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("store.standardPacks")}</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">({standard.length} {t("store.cardsQuantity")})</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                                {standard.map((pack, index) => (
                                    <PackCard key={pack.id || index} pack={pack} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Pacotes Temáticos Personalizados */}
                    {tematics && tematics.length > 0 && (
                        <section id="themed" className="mb-12 sm:mb-16 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Sparkles className="size-4 sm:size-5 text-purple-400 shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("store.thematicPacks")}</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">{t("store.maxLimit")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                                {tematics.map((pack, index) => (
                                    <PackCard withDialog key={pack.id || index} pack={pack} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <KartFloating />
            </div>
        </KartProvider>
    )
}