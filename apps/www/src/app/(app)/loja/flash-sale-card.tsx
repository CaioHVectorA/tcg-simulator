import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { loadTcgImg } from "@/lib/load-tcg-img"

export function FlashSaleCard({ card }: {
    card: {
        name: string
        originalPrice: number
        salePrice: number,
        image_url: string
    }
}) {
    return (
        <Card className="overflow-hidden">
            <div className="relative aspect-[1/1.4]">
                <img src={loadTcgImg(card.image_url)} alt={card.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                    <p className="font-semibold text-sm">{card.name}</p>
                </div>
            </div>
            <CardContent className="p-4">
                <div className="flex flex-col">
                    <span className="line-through text-sm opacity-30">{card.originalPrice}</span>
                    <span className="font-bold -mt-2">{card.salePrice}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Comprar</Button>
            </CardFooter>
        </Card>
    )
}