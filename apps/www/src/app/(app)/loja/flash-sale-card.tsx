import { TcgCard } from "@/components/tcg-card-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { balanceTranslate } from "@/lib/balance-translate"
import { loadTcgImg } from "@/lib/load-tcg-img"
import { useKart } from "./use-kart"
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
    return ((original - sale) / original) * 100
}
export function FlashSaleCard({ card, isPurchased = false }: { card: Promotional, isPurchased?: boolean }) {
    const { addItem, kart, removeItem } = useKart()
    const isInKart = kart.find(item => (item.id === card.id && item.type === 'card'))
    return (
        <li className=" relative list-none">
            {isPurchased && (
                <div className="absolute top-0 bottom-0 z-50 w-full rounded-lg h-full bg-black bg-opacity-50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <h3 className="text-white font-bold text-xl">Já Comprado!</h3>
                    <p className="text-white font-bold text-lg opacity-80">Volte depois.</p>
                </div>
            )}
            <Card className="overflow-hidden">
                <div className="relative aspect-[1/1.4]">
                    <img src={loadTcgImg(card.card.image_url)} alt={card.card.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <p className="font-semibold text-sm">{card.card.name}</p>
                    </div>
                </div>
                <CardContent className="p-4">
                    <div className="flex flex-col">
                        <span className="line-through text-sm opacity-30">{balanceTranslate(card.original_price)}</span>
                        <span className="font-bold -mt-2 text-lg">{balanceTranslate(card.price)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled={isPurchased} onClick={() => {
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
                    }} className="w-full">
                        {isPurchased ? "Comprado" : isInKart ? "Remover" : "Adicionar"}
                    </Button>
                    {/* <Button className="w-full">Comprar</Button> */}
                </CardFooter>
            </Card>
        </li>
    )
}