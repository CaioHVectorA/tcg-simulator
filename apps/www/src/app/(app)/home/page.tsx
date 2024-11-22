'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCcw, Users, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Progress } from '@/components/ui/progress'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Input } from '@/components/ui/input'

// Mock data for last obtained cards
const lastCards = [
    '/wallpaper.jpg',
    '/wallpaper.jpg',
    '/wallpaper.jpg',
]

// Mock data for user ranking
const userRanking = {
    currentRank: 1337,
    totalPlayers: 10000,
    experience: 7500,
    nextRankExperience: 10000,
}

export default function HomePage() {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay()])
    const carouselItems = [
        { title: "Novas Expansões", description: "Descubra as mais recentes cartas da expansão 'Chamas Escarlate'", image: "/wallpaper.jpg" },
        { title: "Torneio Semanal", description: "Participe do nosso torneio semanal e ganhe prêmios exclusivos", image: "/wallpaper.jpg" },
        { title: "Dica do Dia", description: "Aprenda estratégias avançadas com nossos mestres Pokémon", image: "/wallpaper.jpg" },
    ]

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <section className="text-center mb-12">
                <h1 className="text-4xl font-syne font-bold mb-4">Bem-vindo ao Pokémon TCG Simulator</h1>
                <p className="text-xl font-syne mb-6">Explore, colecione e batalhe no mundo dos cards Pokémon!</p>
            </section>

            {/* Functional Carousel */}
            <div className="mb-12">
                <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent ref={emblaRef}>
                        {carouselItems.map((item, index) => (
                            <CarouselItem key={index}>
                                <Card>
                                    <CardContent className="flex aspect-video items-center justify-center p-6">
                                        <div className="text-center">
                                            <img src={item.image} alt={item.title} className="w-full h-48 object-cover mb-4 rounded-md" />
                                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>

            {/* CTA Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCcw className="mr-2" />
                            Trocas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Troque cards com outros jogadores e expanda sua coleção!</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/trades">
                                Ir para Trocas <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Users className="mr-2" />
                            Social
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Conecte-se com outros treinadores, faça amigos e compartilhe suas conquistas!</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline">
                            <Link href="/social">
                                Explorar Social
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Last Cards Obtained */}
            <section className="mb-12">
                <h2 className="text-4xl font-bold mb-6 font-syne">Seus últimos Top Cards</h2>
                <div className="flex relative items-end gap-4 justify-center">
                    {lastCards.map((card) => (
                        <>
                            {/* <Card key={card.id}>
                             <CardHeader>
                                 <CardTitle className="text-lg">{card.name}</CardTitle>
                                 <CardDescription>{card.rarity}</CardDescription>
                             </CardHeader>
                             <CardContent>
                                 <img src={card.image} alt={card.name} className="w-full h-40 object-cover rounded-md" />
                             </CardContent>
                         </Card> */}
                        </>
                    ))}
                    <img className=' rotate-[-30deg] hover:z-50 h-72 mb-9 object-cover aspect-[6/8]' src='https://assets.tcgdex.net/pt/swsh/swsh1/1/high.webp' />
                    <img className='h-96 -mx-36 hover:z-50 object-cover aspect-[6/8] z-20' src='https://assets.tcgdex.net/pt/swsh/swsh1/1/high.webp' />
                    <img className=' rotate-[30deg] hover:z-50 h-72 mb-9 object-cover aspect-[6/8]' src='https://assets.tcgdex.net/pt/swsh/swsh1/1/high.webp' />
                </div>
            </section>

            {/* User Ranking */}
            <section className="bg-primary text-primary-foreground rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><Trophy className="mr-2" /> Seu Ranking Atual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg mb-2">Posição: {userRanking.currentRank} de {userRanking.totalPlayers}</p>
                        <p className="text-lg mb-4">Experiência: {userRanking.experience} / {userRanking.nextRankExperience}</p>
                        <Progress value={(userRanking.experience / userRanking.nextRankExperience) * 100} className="w-full" />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Star className="w-16 h-16 mb-2" />
                        <p className="text-2xl font-bold">Top {Math.round((userRanking.currentRank / userRanking.totalPlayers) * 100)}%</p>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <Button asChild variant="secondary">
                        <Link href="/leaderboard">
                            Ver Classificação Completa
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}