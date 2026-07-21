"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { balanceTranslate } from "@/lib/balance-translate"
import { loadTcgImg } from "@/lib/load-tcg-img"
import { useKart } from "./use-kart"
import { ShoppingCart, Check, Coins, Tag, Lock } from "lucide-react"

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

function calcPercentage(original: number, sale: number) {
    if (!original || original <= sale) return 0
    return Math.round(((original - sale) / original) * 100)
}

export function FlashSaleCard({ card, isPurchased = false }: { card: Promotional, isPurchased?: boolean }) {
    const { addItem, kart, removeItem } = useKart()
    const isInKart = kart.some(item => (item.id === card.id && item.type === 'card'))
    const discountPercent = calcPercentage(card.original_price, card.price)

    return (
        <motion.li 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isPurchased ? {} : { y: -3 }}
            transition={{ duration: 0.2 }}
            className="relative list-none group w-full"
        >
            {isPurchased && (
                <div className="absolute inset-0 z-30 rounded-xl bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 border border-border">
                    <div className="size-7 sm:size-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mb-1">
                        <Lock className="size-3.5 sm:size-4" />
                    </div>
                    <h3 className="text-black dark:text-white font-bold text-xs sm:text-sm">Adquirido</h3>
                </div>
            )}

            <Card className="overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-xl flex flex-col justify-between h-full">
                <div>
                    <div className="relative aspect-[1/1.35] overflow-hidden bg-secondary/50">
                        <img 
                            src={loadTcgImg(card.card.image_url)} 
                            alt={card.card.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />

                        {/* Discount Badge */}
                        {discountPercent > 0 && !isPurchased && (
                            <div className="absolute top-1.5 right-1.5 bg-red-600 text-white font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                                <Tag className="size-2.5 sm:size-3" />
                                <span>-{discountPercent}%</span>
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 sm:p-2 text-white">
                            <p className="font-semibold text-[11px] sm:text-xs tracking-wide line-clamp-1">
                                {card.card.name}
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-2 sm:p-3">
                        <div className="flex flex-col">
                            {card.original_price > card.price && (
                                <span className="line-through text-[10px] sm:text-[11px] text-muted-foreground leading-none">
                                    {balanceTranslate(card.original_price)}
                                </span>
                            )}
                            <div className="flex items-center gap-1 text-black dark:text-white font-bold text-xs sm:text-base mt-0.5">
                                <Coins className="size-3.5 sm:size-4 text-amber-500 fill-amber-500/20 shrink-0" />
                                <span className="truncate">{balanceTranslate(card.price)}</span>
                            </div>
                        </div>
                    </CardContent>
                </div>

                <CardFooter className="p-2 sm:p-3 pt-0">
                    <Button 
                        disabled={isPurchased} 
                        variant={isInKart ? "secondary" : "default"}
                        size="sm"
                        onClick={() => {
                            if (isInKart) {
                                removeItem(card.id)
                            } else {
                                addItem({
                                    type: 'card',
                                    id: card.id,
                                    card_id: card.card_id,
                                    name: card.card.name,
                                    price: card.price,
                                    quantity: 1
                                })
                            }
                        }} 
                        className="w-full font-bold text-[11px] sm:text-xs h-8 sm:h-9 px-2 gap-1"
                    >
                        {isPurchased ? (
                            "Adquirido"
                        ) : isInKart ? (
                            <>
                                <Check className="size-3 sm:size-3.5 shrink-0" />
                                <span className="truncate">No Carrinho</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="size-3 sm:size-3.5 shrink-0" />
                                <span>Adicionar</span>
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </motion.li>
    )
}