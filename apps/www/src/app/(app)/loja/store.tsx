"use client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

const flashSaleCards = [
    { name: "Pikachu", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "rare", originalPrice: 1000, salePrice: 800 },
    { name: "Charizard", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "legendary", originalPrice: 5000, salePrice: 4000 },
    { name: "Bulbasaur", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "common", originalPrice: 500, salePrice: 400 },
    { name: "Mewtwo", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "epic", originalPrice: 3000, salePrice: 2500 },
    { name: "Gyarados", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "rare", originalPrice: 1500, salePrice: 1200 },
    { name: "Snorlax", image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/8/", rarity: "epic", originalPrice: 2500, salePrice: 2000 },
]

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
    return (
        <KartProvider>
            <div className="container mx-auto px-4 py-8 *:font-syne">
                <Navigation />
                <h1 className="text-3xl font-bold mb-8">Loja de Cards</h1>

                {/* Flash Sale Cards */}
                <section id="flashcards" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Promoções Relâmpago</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {promotionalCards.map((card, index) => (
                            <FlashSaleCard key={index} card={card} />
                        ))}
                    </div>
                </section>

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