'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCcw, Users, Star, Trophy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Banner } from './banner'
import { HeaderHome } from './header-home'
import { loadTcgImg } from '@/lib/load-tcg-img'

export function HomePage({ data }: {
    data: {
        banners: {
            title: string
            description: string
            image_url: string
        }[],
        topCards: string[],
        ranking: {
            position: number,
            total_rarity: number,
            count: number
        }
    }
}) {
    // "Falta pouco para você chegar nos top..."
    const nextStep = ((data.ranking.position / data.ranking.count) * 100 - 100) + 10
    return (
        <div className="container mx-auto px-4 py-8">
            <HeaderHome />
            <Banner data={data.banners} />
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
                    {data.topCards[0] ? (
                        <img className='rotate-[-30deg] hover:z-30 h-72 max-md:h-[13.2rem] mb-9 max-md:mb-6 object-cover aspect-[6/8]' src={loadTcgImg(data.topCards[0])} />
                    ) : (
                        <div className='rotate-[-30deg] hover:z-30 h-72 max-md:h-[13.2rem] mb-9 max-md:mb-6 object-cover flex items-center justify-center aspect-[6/8] bg-foreground text-background text-center'>
                            <h1 className=' text-7xl'>?</h1>
                        </div>
                    )}
                    {data.topCards[1] ? (
                        <img className='h-96 max-md:h-64 -mx-36 hover:z-30 object-cover aspect-[6/8] z-20' src={loadTcgImg(data.topCards[1])} />
                    ) : (
                        <div className='h-96 max-md:h-64 -mx-36 hover:z-30 z-30 object-cover flex items-center justify-center aspect-[6/8] bg-foreground text-background text-center'>
                            <h1 className=' text-7xl'>?</h1>
                        </div>
                    )}
                    {data.topCards[2] ? (
                        <img className='rotate-[30deg] hover:z-30 h-72 max-md:h-[13.2rem] mb-9 max-md:mb-6 object-cover aspect-[6/8]' src={loadTcgImg(data.topCards[2])} />
                    ) : (
                        <div className='rotate-[30deg] hover:z-30 h-72 max-md:h-[13.2rem] mb-9 max-md:mb-6 object-cover flex items-center justify-center aspect-[6/8] bg-foreground text-background text-center'>
                            <h1 className=' text-7xl'>?</h1>
                        </div>
                    )}
                </div>
                {data.topCards.length == 0 && (
                    <>
                        <h1 className=' text-center mt-4 text-3xl font-syne'>Parece que você não tem nenhuma carta!</h1>
                        <p className=' text-center mt-2'>Vá para a loja e compre um pacote para começar sua coleção!</p>
                        <div className=' text-center mt-4'>
                            <Button asChild size={'lg'}>
                                <Link href="/loja">
                                    Ir para a Loja
                                    <ExternalLink />
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </section >

            {/* User Ranking */}
            <section className="bg-primary text-primary-foreground rounded-lg p-8" >
                <h2 className="text-2xl font-bold mb-4 flex items-center"><Trophy className="mr-2" /> Seu Ranking Atual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-lg mb-2">Você é o <b>{data.ranking.position}°</b> melhor colecionador!</p>
                        <p className="text-lg mb-4">Pontos de raridade: {data.ranking.total_rarity}</p>
                        {nextStep > 0 && <p>Falta pouco pra você chegar nos top {nextStep}%!</p>}
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Star className="w-16 h-16 mb-2" />
                        <p className="text-2xl font-bold">Top {Math.round((data.ranking.position / data.ranking.count) * 100)}%</p>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <Button asChild variant="secondary">
                        <Link href="/ranking">
                            Ver Classificação Completa
                        </Link>
                    </Button>
                </div>
            </section >
        </div >
    )
}