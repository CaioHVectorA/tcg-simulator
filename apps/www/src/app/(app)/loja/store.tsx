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
    const { get, post } = useApi()
    const qClient = useQueryClient()
    const [bountyReward, setBountyReward] = React.useState<number | null>(null)
    const [bountyModalOpen, setBountyModalOpen] = React.useState(false)

    const { isLoading: loadingBounty, data: timeData, refetch } = useQuery<{ time: string, diff: number, canCollect: boolean, bountyAmounty: boolean | number }>({
        queryKey: ['bounty-time'],
        queryFn: async () => {
            const res = await get('/user/bounty-time')
            return res.data.data ?? res.data
        }
    })
    const { mutateAsync, isPending } = useMutation({
        mutationKey: ['bounty-collect'],
        mutationFn: async () => {
            const res = await post('/user/bounty', {})
            const reward = Number(timeData?.bountyAmounty) || 100
            setBountyReward(reward)
            setBountyModalOpen(true)
            await refetch()
            await qClient.invalidateQueries({ queryKey: ['user'] })
            await qClient.refetchQueries({ queryKey: ['user'] })
            return res.data.data ?? res.data
        }
    })

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
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                                Loja de Pacotes & Cartas
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 max-w-xl">
                                Adquira booster packs, colete sua recompensa diária e garanta cartas promocionais em oferta.
                            </p>
                        </div>
                    </div>

                    {/* Daily Reward / Bounty Section */}
                    {timeData && !loadingBounty && (
                        <section id="bounty" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border bg-card shadow-xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                                    <div className="flex flex-row items-center gap-3 sm:gap-4 text-left">
                                        <div className="size-12 sm:size-14 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                                            <Gift className="size-6 sm:size-7" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Bônus Diário</span>
                                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Recompensa Diária</h2>
                                            {timeData.canCollect ? (
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                    Você tem <span className="font-bold text-black dark:text-white">{balanceTranslate(Number(timeData.bountyAmounty))} moedas</span> para coletar!
                                                </p>
                                            ) : (
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                    Você já resgatou sua recompensa diária hoje.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {timeData.canCollect ? (
                                        <Button 
                                            onClick={() => mutateAsync()} 
                                            disabled={isPending}
                                            className="w-full sm:w-auto px-5 font-bold h-10 text-xs sm:text-sm"
                                        >
                                            {isPending ? 'Resgatando...' : 'Coletar Recompensa'}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-secondary px-3.5 py-2 rounded-xl border border-border shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                                            <Clock className="size-4 text-muted-foreground shrink-0" />
                                            <div className="flex items-center gap-1.5 text-left">
                                                <span className="text-xs text-muted-foreground font-medium">Tempo:</span>
                                                <span className="text-xs sm:text-sm font-mono font-bold text-black dark:text-white">
                                                    <Timer initialTime={timeData.diff} />
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Flash Sale Cards */}
                    {!loading && data && promotionalCards && promotionalCards.length > 0 && (
                        <section id="flashcards" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Zap className="size-4 sm:size-5 text-amber-500 shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Promoções de Hoje</h2>
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

                    {/* Standard Packs */}
                    {standard && standard.length > 0 && (
                        <section id="standard" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <PackageIcon className="size-4 sm:size-5 text-primary shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Pacotes Padrão</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">Booster packs clássicos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                                {standard.map((pack, index) => (
                                    <PackCard key={pack.id || index} pack={pack} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Themed Packs */}
                    {tematics && tematics.length > 0 && (
                        <section id="themed" className="mb-8 sm:mb-10 scroll-mt-20">
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Sparkles className="size-4 sm:size-5 text-purple-500 shrink-0" />
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Pacotes Temáticos</h2>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">Edições especiais com cartas selecionadas</p>
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
                <RewardModal 
                    open={bountyModalOpen}
                    onOpenChange={setBountyModalOpen}
                    iconType="bounty"
                    title="Bônus Diário Resgatado! 🎉"
                    description="Sua recompensa diária foi adicionada ao seu saldo com sucesso."
                    rewardAmount={bountyReward || undefined}
                />
            </div>
        </KartProvider>
    )
}