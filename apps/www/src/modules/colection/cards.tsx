import Head from 'next/head'
import Image from 'next/image'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { loadTcgImg } from '@/lib/load-tcg-img'
import { Metadata } from 'next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TcgCard } from '@/components/tcg-card-view'

type CardItem = {
    id: string
    name: string
    image_url: string
    card_id: string
    rarity: number
    quantity: number
}

type InventoryProps = {
    data: CardItem[]
    currentPage: number
    totalPages: number,
    search: string
}
export const metadata: Metadata = {
    title: "Coleção | Pokémon TCG Simulator",
    description: "Veja seu inventário de cartas Pokémon",
}

export function Cards({ data, currentPage, totalPages, search }: InventoryProps) {
    const addParam = (key: string, value: string) => {
        let url = `/colecao`
        if (search) {
            url += `?search=${search}`
            url += `&${key}=${value}`
            return url
        }
        url += `?${key}=${value}`
        return url
    }
    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className=' flex justify-between items-center'>
                    <h1 className="text-3xl font-bold mb-6">Sua coleção</h1>
                    <form className="flex items-center">
                        <Input type="search" defaultValue={search ?? ''} name="search" placeholder="Pesquisar" className="mr-4" />
                        <Button type="submit">Pesquisar</Button>
                    </form>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {data.map((card) => <TcgCard url={card.image_url} key={card.id} />)}
                </div>
                <Pagination>
                    <PaginationContent className=' gap-0'>
                        <PaginationItem>
                            <PaginationPrevious href={currentPage > 1 ? addParam('page', (currentPage - 1).toString()) : '#'} />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                {Math.abs(currentPage - page) <= 2 ? (
                                    <PaginationLink href={addParam('page', page.toString())} isActive={page === currentPage}>
                                        {page}
                                    </PaginationLink>
                                ) : page === 1 || page === totalPages ? (
                                    <PaginationLink href={addParam('page', page.toString())}>
                                        {page}
                                    </PaginationLink>
                                ) : page === 2 || page === totalPages - 1 ? (
                                    <PaginationEllipsis />
                                ) : null}
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext href={currentPage < totalPages ? addParam('page', (currentPage + 1).toString()) : '#'} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </>
    )
}