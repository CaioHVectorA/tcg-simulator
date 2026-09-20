"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DialogHeader } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { loadTcgImg } from "@/lib/load-tcg-img"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/use-api"
import InfiniteScroll from "@/components/ui/infinite-scroll"
import { Loader2, ShoppingCart, Eye, Coins, Sparkles, Package as PackageIcon } from "lucide-react"
import { useKart } from "../use-kart"
import { NumberQuantityInput } from "@/components/ui/quantity-input"
import { balanceTranslate } from "@/lib/balance-translate"
import { Skeleton } from "@/components/ui/skeleton"
import { BoosterPackArt } from "@/components/booster-pack-art"

type Package = {
    price: number
    name: string
    id: number
    description?: string
    tcg_id?: string
    image_url: string
}

type CardType = {
    id: string | number
    name: string
    image_url: string
}

function BuyPack({ pack }: { pack: Package }) {
    const [quantity, setQuantity] = useState(1)
    const { addItem } = useKart()
    
    const buy = () => {
        addItem({
            type: 'package',
            id: pack.id,
            name: pack.name,
            price: pack.price,
            quantity
        })
    }

    return (
        <div className="flex flex-col gap-3 py-2 font-syne">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="quantity" className="text-xs font-semibold text-muted-foreground">
                    Quantidade de pacotes:
                </Label>
                <NumberQuantityInput
                    initialValue={quantity}
                    min={1}
                    max={99}
                    onChange={setQuantity}
                    className="w-full text-base"
                />
            </div>

            <div className="p-2.5 rounded-xl bg-secondary border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Total:</span>
                <div className="flex items-center gap-1 font-bold text-foreground text-base sm:text-lg">
                    <Coins className="size-4 text-amber-500 fill-amber-500/20" />
                    <span>{balanceTranslate(pack.price * quantity)}</span>
                </div>
            </div>

            <SheetClose asChild>
                <Button 
                    onClick={buy} 
                    className="w-full font-bold gap-2 text-xs sm:text-sm h-10" 
                    disabled={quantity <= 0}
                >
                    <ShoppingCart className="size-4" />
                    <span>Adicionar ao Carrinho</span>
                </Button>
            </SheetClose>
        </div>
    )
}

import { ThematicLootboxDialog } from "../thematic-lootbox-dialog"

export function PackCard({ pack, withDialog = false }: {
    pack: Package,
    withDialog?: boolean
}) {
    const [cards, setCards] = useState<CardType[]>([])
    const { get, loading, data } = useApi<{ cards: CardType[], pages: number, currentPage: number }>({ cache: true })
    const [hasMore, setHasMore] = useState(true)
    const [lootboxOpen, setLootboxOpen] = useState(false)

    const isThematic = !!pack.tcg_id
    const isStandardPack = !pack.tcg_id

    const next = async () => {
        const page = data?.currentPage || 1
        if (page < (data?.pages || 99)) {
            const res = await get(`/packages/cards?packageId=${pack.tcg_id}&page=${page + 1}`)
            //@ts-ignore
            setCards((prev) => [...prev, ...res.data.data.cards])
            if (res.data.data.currentPage === res.data.data.pages) setHasMore(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
        >
            <Card className="overflow-hidden border border-border/80 bg-card/80 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-200 rounded-2xl flex flex-col justify-between h-full group">
                <div>
                    <div className="relative aspect-[1/1.38] overflow-hidden bg-secondary/30 flex items-center justify-center p-2.5">
                        {isStandardPack ? (
                            <div className="w-full h-full">
                                <BoosterPackArt name={pack.name} showCrimp={true} />
                            </div>
                        ) : (
                            <div className="w-full h-full relative flex items-center justify-center">
                                <img 
                                    src={loadTcgImg(pack.image_url)} 
                                    alt={pack.name} 
                                    className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105" 
                                />
                                <div className="absolute top-2 left-2 bg-purple-950/80 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                    <Sparkles className="size-3 text-purple-400" />
                                    <span>Lootbox</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">
                                {isThematic ? "A partir de" : "Preço"}
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-foreground text-xs sm:text-sm">
                                <Coins className="size-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                                <span className="truncate">{isThematic ? "500" : balanceTranslate(pack.price)}</span>
                            </div>
                        </div>
                    </CardContent>
                </div>

                <CardFooter className="p-3 pt-0 flex items-center gap-2">
                    {isThematic ? (
                        <>
                            <Button 
                                onClick={() => setLootboxOpen(true)}
                                className="flex-1 font-bold text-[11px] sm:text-xs h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20"
                                size="sm"
                            >
                                <Sparkles className="size-3.5 shrink-0" />
                                <span>Abrir Lootbox</span>
                            </Button>
                            <ThematicLootboxDialog 
                                open={lootboxOpen} 
                                onOpenChange={setLootboxOpen} 
                                pack={pack} 
                            />
                        </>
                    ) : (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="flex-1 font-bold text-[11px] sm:text-xs h-9 gap-1.5" size="sm">
                                    <ShoppingCart className="size-3.5 shrink-0" />
                                    <span>Comprar</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="font-syne bg-background border-border text-foreground w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                                        <PackageIcon className="size-4 sm:size-5 text-primary" />
                                        <span className="truncate">Comprar {pack.name}</span>
                                    </SheetTitle>
                                    <SheetDescription className="text-xs">
                                        Escolha a quantidade desejada.
                                    </SheetDescription>
                                </SheetHeader>
                                <BuyPack pack={pack} />
                            </SheetContent>
                        </Sheet>
                    )}

                    {withDialog && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button 
                                    onClick={async () => {
                                        const res = await get(`/packages/cards?packageId=${pack.tcg_id}`)
                                        if (res.data?.data?.cards) {
                                            setCards(res.data.data.cards)
                                        }
                                    }} 
                                    variant="outline" 
                                    size="sm"
                                    className="border-border font-semibold text-[11px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 shrink-0"
                                    title="Ver Cartas"
                                >
                                    <Eye className="size-3.5 shrink-0 sm:mr-1" />
                                    <span className="hidden sm:inline">Cartas</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[92vw] sm:max-w-3xl max-h-[85vh] flex flex-col font-syne bg-background border-border text-foreground p-4 sm:p-6 rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                        <Sparkles className="size-4 sm:size-5 text-amber-500 shrink-0" />
                                        <span className="truncate">Cartas em {pack.name}</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Lista de cartas disponíveis neste booster pack.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex-1 overflow-y-auto pr-1">
                                    {loading && cards.length === 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 py-2">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <Skeleton key={i} className="aspect-[1/1.4] rounded-xl bg-secondary" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 py-2">
                                            {cards.map((card, idx) => (
                                                <div
                                                    key={`${card.id}-${idx}`}
                                                    className="overflow-hidden rounded-xl bg-secondary/30 border border-border p-1 hover:border-primary/50 transition-colors"
                                                >
                                                    <img 
                                                        src={loadTcgImg(card.image_url)} 
                                                        alt={card.name} 
                                                        className="w-full h-full object-contain" 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
                                        {hasMore && <Loader2 className="my-3 size-5 mx-auto animate-spin text-primary" />}
                                    </InfiniteScroll>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    )
}