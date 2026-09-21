"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DialogHeader } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { loadTcgImg } from "@/lib/load-tcg-img"
import { TcgCardImage } from "@/components/tcg-card-image"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/use-api"
import { useQueryClient } from "@tanstack/react-query"
import InfiniteScroll from "@/components/ui/infinite-scroll"
import { generateUUID } from "@/lib/uuid"
import { Loader2, ShoppingCart, Eye, Coins, Sparkles, Package as PackageIcon, Info, Zap, LoaderCircle } from "lucide-react"
import { useKart } from "../use-kart"
import { NumberQuantityInput } from "@/components/ui/quantity-input"
import { balanceTranslate } from "@/lib/balance-translate"
import { Skeleton } from "@/components/ui/skeleton"
import { BoosterPackArt } from "@/components/booster-pack-art"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Package = {
    price: number
    name: string
    id: number
    description?: string
    tcg_id?: string
    image_url: string
    cards_quantity?: number
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
import { PackOpeningModal } from "@/components/pack-opening-modal"

function getPackMiniDescription(pack: Package): string {
    if (pack.description && pack.description.trim().length > 0) {
        return pack.description;
    }
    const lower = pack.name.toLowerCase();
    if (lower.includes("tudo ou nada")) {
        return "Contém apenas 1 carta de altíssimo risco e adrenalina máxima! Chance colossal de 82% de god pull ou lendária secreta.";
    }
    if (lower.includes("lendário") || lower.includes("lendario")) {
        return "Apenas 1 carta, com chances astronômicas (65%+) de ser uma carta Lendária ou Mística.";
    }
    if (lower.includes("épicos") || lower.includes("epico") || lower.includes("épico")) {
        return "3 cartas selecionadas com 60%+ de chances de conter cartas de Tier 3 (Épicas) e V/ex.";
    }
    if (lower.includes("grande pacote épico")) {
        return "24 cartas volumosas com múltiplas cartas épicas garantidas no mesmo lote.";
    }
    if (lower.includes("grande pacote")) {
        return "16 cartas no mesmo booster para acelerar o crescimento da sua coleção.";
    }
    if (lower.includes("raro kanto")) {
        return "5 cartas focadas exclusivamente nos 151 Pokémon de Kanto com garantia de raras.";
    }
    if (lower.includes("iniciação") || lower.includes("iniciacao")) {
        return "5 cartas equilibradas para novos treinadores começarem com uma base sólida.";
    }
    if (lower.includes("raro")) {
        return "8 cartas com probabilidade aumentada de cartas raras e brilhantes holográficas.";
    }
    if (lower.includes("simples")) {
        return "8 cartas clássicas de entrada por um preço acessível de 100 moedas.";
    }
    if (lower.includes("mítico") || lower.includes("celestial")) {
        return "🌟 Edição Cósmica Mítica forjada por Arceus: taxas elevadas de cartas Tier 4 (Místicas) e ultra raras.";
    }
    if (lower.includes("vórtice") || lower.includes("sombrio")) {
        return "🌌 Edição Dimensional Giratina: extraído do Mundo Distorcido, focado em Pokémon sombrios de alto impacto.";
    }
    if (lower.includes("tempestade") || lower.includes("elemental")) {
        return "Fúria elemental de fogo, água e trovão com cartas raras e poderes da natureza.";
    }
    if (pack.tcg_id) {
        return `Coleção oficial ${pack.name}. Deposite moedas para receber cartas exclusivas deste conjunto com proteção contra repetidas!`;
    }
    return "Booster pack oficial com cartas selecionadas para sua coleção e futuros decks de batalha.";
}

export function PackCard({ pack, withDialog = false }: {
    pack: Package,
    withDialog?: boolean
}) {
    const [cards, setCards] = useState<CardType[]>([])
    const { get, post, loading, data } = useApi<{ cards: CardType[], pages: number, currentPage: number }>({ cache: true })
    const { post: buyPost, loading: buyLoading } = useApi()
    const qClient = useQueryClient()
    const [hasMore, setHasMore] = useState(true)
    const [lootboxOpen, setLootboxOpen] = useState(false)
    const [buyAndOpenModalOpen, setBuyAndOpenModalOpen] = useState(false)
    const [buyAndOpenPack, setBuyAndOpenPack] = useState<UserPackage | null>(null)

    const isThematic = !!pack.tcg_id
    const isStandardPack = !pack.tcg_id

    const handleBuyAndOpen = async () => {
        try {
            const key = generateUUID();
            const res = await buyPost("/store/checkout?key=" + key, {
                items: [{ type: 'package', id: pack.id, name: pack.name, price: pack.price, quantity: 1 }]
            });
            if (res.data?.ok) {
                qClient.invalidateQueries({ queryKey: ["user"] });
                qClient.invalidateQueries({ queryKey: ["packages"] });
                // Create a UserPackage to pass to the opening modal
                const userPack: UserPackage = {
                    id: res.data?.data?.packageUserIds?.[0] ?? pack.id,
                    name: pack.name,
                    image_url: pack.image_url,
                    tcg_id: pack.tcg_id,
                    cards_quantity: pack.cards_quantity ?? 5,
                    quantity: 1,
                    description: pack.name,
                };
                setBuyAndOpenPack(userPack);
                setBuyAndOpenModalOpen(true);
            }
        } catch (err) {
            console.error("Buy and open error:", err);
        }
    };

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
                        {/* Botão (i) com Mini Descrição em Popover */}
                        <div className="absolute top-2 right-2 z-20">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="size-7 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/20 text-amber-300 hover:text-amber-200 flex items-center justify-center transition-all duration-150 shadow-md hover:scale-110 active:scale-95 cursor-pointer"
                                        title="Informações e Detalhes"
                                        aria-label={`Informações sobre ${pack.name}`}
                                    >
                                        <Info className="size-3.5" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-72 p-3.5 font-syne bg-popover border border-border shadow-xl rounded-xl z-50 text-xs text-foreground"
                                    side="top"
                                    align="end"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-1.5 gap-2">
                                            <span className="font-bold text-sm text-foreground truncate">{pack.name}</span>
                                            {pack.cards_quantity ? (
                                                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 border-primary/40 text-primary shrink-0">
                                                    {pack.cards_quantity} cartas
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed font-sans">
                                            {getPackMiniDescription(pack)}
                                        </p>
                                        {isStandardPack && (
                                            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-amber-500 font-bold border-t border-border/40">
                                                <span className="text-muted-foreground font-sans text-[10px]">Custo:</span>
                                                <span className="flex items-center gap-1">
                                                    <Coins className="size-3" /> {balanceTranslate(pack.price)} moedas
                                                </span>
                                            </div>
                                        )}
                                        {isThematic && (
                                            <div className="pt-1 text-[10px] text-purple-400 font-sans italic border-t border-border/40">
                                                Depósito personalizado até 100.000 moedas com proteção anti-duplicatas!
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {isStandardPack ? (
                            <div className="w-full h-full">
                                <BoosterPackArt name={pack.name} showCrimp={true} />
                            </div>
                        ) : (
                            <div className="w-full h-full relative flex items-center justify-center">
                                <BoosterPackArt 
                                    name={pack.name} 
                                    logoUrl={loadTcgImg(pack.image_url)} 
                                    showCrimp={true} 
                                />
                                <div className="absolute top-2 left-2 bg-purple-950/90 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md z-20 backdrop-blur-xs">
                                    <Sparkles className="size-3 text-purple-400" />
                                    <span>Personalizado</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                            <h3 className="font-bold text-xs sm:text-sm text-foreground truncate" title={pack.name}>
                                {pack.name}
                            </h3>
                            {pack.cards_quantity && (
                                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                    {pack.cards_quantity} cartas
                                </span>
                            )}
                        </div>
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
                                <span>Personalizar &amp; Abrir</span>
                            </Button>
                            <ThematicLootboxDialog
                                open={lootboxOpen}
                                onOpenChange={setLootboxOpen}
                                pack={pack}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center gap-2">
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
                            </div>
                            {/* Buy and Open immediately button */}
                            <Button
                                onClick={handleBuyAndOpen}
                                disabled={buyLoading}
                                variant="outline"
                                size="sm"
                                className="w-full font-bold text-[11px] sm:text-xs h-9 gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/60"
                            >
                                {buyLoading ? (
                                    <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
                                ) : (
                                    <Zap className="size-3.5 shrink-0" />
                                )}
                                <span>Comprar e Abrir</span>
                            </Button>
                        </div>
                    )}

                    {buyAndOpenPack && (
                        <PackOpeningModal
                            isOpen={buyAndOpenModalOpen}
                            onClose={() => { setBuyAndOpenModalOpen(false); setBuyAndOpenPack(null); }}
                            pack={buyAndOpenPack}
                            initialQuantity={1}
                        />
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
                                                    <TcgCardImage
                                                        src={card.image_url}
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