import { LoadingRing } from '@/components/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetch } from '@/hooks/use-fetch';
import { loadTcgImg } from '@/lib/load-tcg-img';
import { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/use-api';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { TcgCard } from '@/components/tcg-card-view';
import { useQueryClient } from '@tanstack/react-query';

interface UserPackageProps {
    packageData: UserPackage;
    setCanGoNext: (canGoNext: boolean) => void;
    actualPack: number;
    isFlipped: boolean;
    setIsFlipped: (isFlipped: boolean) => void;
}

export const PackageOpening: React.FC<UserPackageProps> = ({ packageData, setCanGoNext, actualPack, isFlipped, setIsFlipped }) => {
    // const [isFlipped, setIsFlipped] = useState(false)
    const { post, data, loading } = useApi()
    const [api, setApi] = useState<CarouselApi>()
    const handleFlip = () => {
        // setIsFlipped(!isFlipped)
        if (isFlipped) return
        setIsFlipped(true)
        setCanGoNext(true)
        post(`/packages/open`, { packageId: packageData.id })
    }
    useEffect(() => {
        setIsFlipped(false)
        api?.scrollTo(0)
        // post(`/packages/open`, { packageId: packageData.id })
    }, [actualPack])
    return (
        <Card
            className="w-[64%] max-w-sm mx-auto cursor-pointer"
            onClick={handleFlip}
        >
            <CardHeader>
                <CardTitle className=' font-syne'>{packageData.name}</CardTitle>
                {!isFlipped && <p className=' font-syne text-center'>Clique no pacote para abrí-lo!</p>}

            </CardHeader>
            <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div style={{ backfaceVisibility: 'hidden' }}>
                    <CardContent>
                        <div className="relative w-full aspect-[2/3]">
                            <img
                                src={loadTcgImg(packageData.image_url, true)}
                                alt={packageData.name}
                                // layout="fill"
                                // objectFit="contain"
                                className="rounded-lg object-contain"
                            />
                        </div>
                    </CardContent>
                </div>
                <motion.div
                    style={{
                        backfaceVisibility: 'hidden',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        transform: 'rotateY(180deg)',
                    }}
                    className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg"
                >
                    {loading && <LoadingRing />}
                    {data && (
                        <Carousel setApi={setApi} className=' w-full p-6'>
                            <CarouselContent>
                                {data.map((card: { name: string, id: number, card_id: string, image_url: string, rarity: string }, index: number) => (
                                    <CarouselItem key={card.id + index}>
                                        <img src={loadTcgImg(card.image_url)} alt={card.name} width={300} height={400} className=' w-[300px] h-[400px]' />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                            <p className=' font-syne opacity-60 text-center mt-2 text-sm'>Deslize para os lados para ver suas cartas</p>
                        </Carousel>
                    )}
                </motion.div>
            </motion.div>

        </Card>
    )
}
function CardsViewer({ cards }: { cards: Card[] }) {
    if (!cards) return
    return (

        <div className="max-h-[70vh] overflow-y-auto">
            <div className="mt-4 grid grid-cols-4 max-md:grid-cols-2 gap-4">
                {cards.map(({ image_url, id }, index) => (
                    <TcgCard key={id + index} url={image_url} />
                ))}
            </div>
        </div>
    )
}
export function OpenPackagePopup({
    quantity, pack
}: {
    quantity: number;
    pack: UserPackage;
}) {
    const [actualPack, setActualPack] = useState(0)
    const [cards, setCards] = useState<Card[]>()
    const qClient = useQueryClient()
    const isLastPack = actualPack === quantity - 1
    const { post, data, loading } = useApi()
    const handleNext = () => {
        if (isLastPack) {
            setOpen(false)
            qClient.invalidateQueries({ queryKey: ['packages'] })
            qClient.refetchQueries({ queryKey: ['packages'] })

        } else {
            setActualPack(actualPack + 1)
        }
    }
    useLayoutEffect(() => {
        setCards(undefined)
        setActualPack(0)
    }, [quantity, pack])
    const [open, setOpen] = useState(false)
    const [canGoNext, setCanGoNext] = useState(false)
    const [isFlipped, setIsFlipped] = useState(false)
    const handleOpenAll = async () => {
        const rest = quantity - actualPack
        const res = await post(`/packages/open-packages`, { packagesId: Array.from({ length: rest }, (_, i) => pack.id) })
        const cards = (res.data.data ?? res.data)
        if (!cards) return
        setCanGoNext(true)
        setActualPack(quantity - 1)
        setCards(cards)
    }
    console.log({ actualPack, canGoNext })
    return (
        <AlertDialog open={open}>
            <AlertDialogTrigger asChild>
                <Button className="w-full mt-4" onClick={() => setOpen(true)}>Abrir</Button>
            </AlertDialogTrigger>
            <AlertDialogPortal>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader className=' font-syne'>
                            {!cards && <AlertDialogTitle>Abrindo {actualPack + 1}/{quantity} pacote</AlertDialogTitle>}
                            {cards && <AlertDialogTitle>Cartas obtidas</AlertDialogTitle>}
                        </AlertDialogHeader>
                        <AlertDialogDescription asChild className=' w-full h-full'>
                            {cards ? <CardsViewer cards={cards} /> : (

                                <PackageOpening isFlipped={isFlipped} setIsFlipped={setIsFlipped} packageData={pack} setCanGoNext={setCanGoNext} actualPack={actualPack} />
                            )}
                            {/* {Packs[actualPack]({ packageData: pack, setCanGoNext, actualPack })} */}
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            {(!cards && !isFlipped) && <AlertDialogCancel onClick={handleOpenAll}>Abrir todos</AlertDialogCancel>}
                            <AlertDialogAction disabled={!(canGoNext) || (quantity == 1 && !isFlipped)} onClick={handleNext}>
                                {isLastPack ? 'Finalizar' : 'Próximo'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialogPortal>
        </AlertDialog>
    )
}