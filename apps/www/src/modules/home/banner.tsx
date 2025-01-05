import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { getApiImage } from '@/lib/api'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Banner = {
    title: string
    description: string
    image_url: string
    anchor?: string
}
export function Banner({
    data
}: {
    data: Banner[]
}) {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay()])
    return (
        <div className="mb-12">
            <Carousel className="w-full max-md:max-w-[60vw] max-w-4xl mx-auto">
                <CarouselContent ref={emblaRef}>
                    {data.map((item, index) => (
                        <CarouselItem key={index}>
                            <Card>
                                <CardContent className="flex aspect-video items-center justify-center p-6">
                                    <div className="text-center min-h-full w-full">
                                        <img src={getApiImage(item.image_url)} alt={item.title} className="w-8/12 mx-auto aspect-video object-contain mb-4 rounded-md" />
                                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                        <p>{item.description}</p>
                                        {item.anchor && <Button size={'lg'} className=' my-2 font-syne' asChild>
                                            <Link href={item.anchor}>Acesse agora!
                                                <ExternalLink />
                                            </Link>

                                        </Button>}
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                    {data.length === 0 && (
                        <CarouselItem>
                            <Card>
                                <CardContent className="flex aspect-video items-center justify-center p-6">
                                    <div className="text-center min-h-full w-full">
                                        <img src="https://via.placeholder.com/400x200" alt="Placeholder" className="w-8/12 mx-auto aspect-video object-cover mb-4 rounded-md" />
                                        <h3 className="text-xl font-semibold mb-2">Banner</h3>
                                        <p>Descrição do banner</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    )}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    )
}