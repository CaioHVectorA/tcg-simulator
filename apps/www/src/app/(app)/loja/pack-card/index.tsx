"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DialogHeader } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Loader, LoadingRing } from '@/components/loading-spinner'
import { loadTcgImg } from "@/lib/load-tcg-img"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useApi } from "@/hooks/use-api"
import InfiniteScroll from "@/components/ui/infinite-scroll"
import { Loader2 } from "lucide-react"
import { KartProvider, useKart } from "../use-kart"
import { KartFloating } from "../kart-floating"
import { NumberQuantityInput } from "@/components/ui/quantity-input"
type Package = {
    price: number
    name: string
    id: number
    tcg_id?: string
    image_url: string
}

function BuyPack({ pack }: { pack: Package }) {
    const [quantity, setQuantity] = useState(1)
    const { addItem, kart } = useKart()
    const buy = () => {
        console.log({ kart })
        addItem({
            type: 'package',
            id: pack.id,
            name: pack.name,
            price: pack.price,
            quantity
        })
    }
    return (
        <>
            <div className="grid gap-4 py-4 font-syne">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                        Quantidade
                    </Label>
                    {/* <Input
                        id="quantity"
                        type="number"
                        className="col-span-3 text-lg"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min={1}
                    /> */}
                    <NumberQuantityInput

                        initialValue={quantity}
                        min={1}
                        onChange={setQuantity}
                        className="col-span-3 text-lg"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span>Total:</span>
                    <span className="font-bold">{pack.price * quantity} moedas</span>
                </div>
            </div>
            <SheetClose asChild>
                <Button onClick={buy} className="w-full" disabled={quantity == 0}>Adicionar ao carrinho</Button>
            </SheetClose>
        </>
    )
}

export function PackCard({ pack, withDialog = false }: {
    pack: Package,
    withDialog?: boolean
}) {
    const [cards, setCards] = useState<Card[]>([])
    const { get, loading, data } = useApi<{ cards: Card[], pages: number, currentPage: number }>({ cache: true })
    const [hasMore, setHasMore] = useState(true)
    const next = async () => {
        const page = data?.currentPage || 1
        if (page < (data?.pages || 99)) {
            const res = await get(`/packages/cards?packageId=${pack.tcg_id}&page=${page + 1}`)
            console.log({ res_data: res.data })
            //@ts-ignore
            setCards([...cards, ...res.data.data.cards])
            if (res.data.data.currentPage === res.data.data.pages) setHasMore(false)
        }
    }
    return (
        <>
            <Card className="overflow-hidden">
                <div className="relative aspect-[1/1.4]">
                    <img src={loadTcgImg(pack.image_url)} alt={pack.name} className="w-full h-full object-contain bg-black" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <p className="font-semibold text-sm">{pack.name}</p>
                    </div>
                </div>
                <CardContent className="p-4">
                    <p className="font-bold text-lg">{pack.price} moedas</p>
                </CardContent>
                <CardFooter className="flex justify-between gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className=" w-full">Comprar</Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle className=" font-syne font-bold">Comprar {pack.name}</SheetTitle>
                                <SheetDescription>Escolha a quantidade desejada</SheetDescription>
                            </SheetHeader>
                            <BuyPack pack={pack} />
                        </SheetContent>
                    </Sheet>
                    {withDialog && <Dialog>
                        <DialogTrigger asChild>
                            <Button onClick={async () => {
                                const res = await get(`/packages/cards?packageId=${pack.tcg_id}`)
                                console.log({ data })
                                setCards(res.data.data.cards)
                            }} variant="outline">Ver Cartas</Button>
                        </DialogTrigger>
                        <DialogContent className=" max-w-[70vw]">
                            <DialogHeader>
                                <DialogTitle>Cartas em {pack.name}</DialogTitle>
                                <DialogDescription>
                                    Lista de cartas disponíveis neste pacote.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto">
                                <div className="mt-4 grid grid-cols-4 gap-4">
                                    {cards.map((card) => <img key={card.card_id} src={loadTcgImg(card.image_url)} alt={card.name} className="object-contain" />)}
                                </div>
                                <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
                                    {/* {hasMore && <LoadingRing />} */}
                                    {hasMore && <Loader2 className="my-4 size-12 mx-auto animate-spin" />}
                                </InfiniteScroll>
                            </div>
                        </DialogContent>
                    </Dialog>}
                </CardFooter>
            </Card>
        </>
    )
}