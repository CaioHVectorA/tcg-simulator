"use client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loadTcgImg } from '@/lib/load-tcg-img'
import { PackCard } from './pack-card'
import { FlashSaleCard } from "./flash-sale-card"
import { Navigation } from "./navigation"
import { KartProvider } from "./use-kart"
import { KartFloating } from "./kart-floating"
import { useApi } from "@/hooks/use-api"
import { useFetch } from "@/hooks/use-fetch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Timer } from "@/modules/timer"

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

export function StorePage({ data: { standard, tematics, promotionalCards } }: {
    data: {
        standard: Package[]
        tematics: Package[],
        promotionalCards: Promotional[]
    }
}) {
    const { get, post } = useApi()
    const qClient = useQueryClient()
    const { isLoading: loadingBounty, data: timeData, error, refetch } = useQuery<{ time: string, diff: number, canCollect: boolean, bountyAmounty: boolean }>({
        queryKey: ['bounty-time'],
        queryFn: async () => {
            const res = await get('/user/bounty-time')
            return res.data.data ?? res.data
        }
    })
    const { mutateAsync, data: bountyData, isPending } = useMutation({
        mutationKey: ['bounty-collect'],
        mutationFn: async () => {
            const res = await post('/user/bounty', {})
            await refetch()
            await qClient.invalidateQueries({ queryKey: ['user'] })
            await qClient.refetchQueries({ queryKey: ['user'] })
            return res.data.data ?? res.data
        }
    })
    const { data, loading, setData } = useFetch('/store/bought-promotional/') as unknown as { data: number[], loading: boolean, setData: React.Dispatch<React.SetStateAction<number[]>> }
    const isInPurchased = (id: number) => data.includes(id)
    return (
        <KartProvider setData={setData}>
            <div className="container mx-auto px-4 py-8 *:font-syne">
                <Navigation />
                <h1 className="text-5xl font-bold mb-8">Loja</h1>
                <h2 className="text-2xl font-bold mb-4">Resgate sua recompensa diária</h2>
                {timeData && !loadingBounty && <section className=" border font-syne w-fit mx-auto px-12 flex flex-col justify-center items-center py-8 gap-2 rounded-lg">
                    {timeData.canCollect ? (
                        <>
                            <h2 className=" text-4xl">Colete sua recompensa diária!</h2>
                            <p>Você pode coletar sua recompensa diária de {timeData.bountyAmounty} moedas!</p>
                            <Button onClick={() => mutateAsync()} className=" lg:px-40">
                                {isPending ? 'Carregando...' : 'Coletar recompensa'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <h2 className=" text-4xl">Recompensa diária</h2>
                            <p>Você já coletou sua recompensa diária, volte amanhã para coletar novamente!</p>
                            <p>Tempo restante para coletar: <Timer initialTime={timeData.diff} /></p>
                        </>
                    )}
                </section>}
                {/* Flash Sale Cards */}
                {!loading && data && <section id="flashcards" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Promoções de hoje</h2>
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {promotionalCards.map((card, index) => (
                            <FlashSaleCard isPurchased={isInPurchased(card.card_id)} key={index} card={card} />
                        ))}
                    </ul>
                </section>}

                {/* Standard Packs */}
                <section id="standard" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Pacotes Padrão</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {standard.map((pack, index) => (
                            <PackCard key={index} pack={pack} />
                        ))}
                    </div>
                </section>

                {/* Themed Packs */}
                <section id="themed" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Pacotes Temáticos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tematics.map((pack, index) => (
                            <PackCard withDialog key={index} pack={pack} />
                        ))}
                    </div>
                </section>
            </div>
            <KartFloating />
        </KartProvider>
    )
}