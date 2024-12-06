import { TcgCard } from "@/components/tcg-card-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { balanceTranslate } from "@/lib/balance-translate"
import { loadTcgImg } from "@/lib/load-tcg-img"
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
export function FlashSaleCard({ card }: { card: Promotional }) {
    return (
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
                <Button className="w-full">Comprar</Button>
            </CardFooter>
        </Card>
    )
}