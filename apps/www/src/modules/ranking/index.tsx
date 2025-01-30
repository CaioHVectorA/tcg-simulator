"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InfiniteScroll from '@/components/ui/infinite-scroll';
import { useApi } from '@/hooks/use-api';
import { Loader2 } from 'lucide-react';
import { default as NiceAvatar, genConfig } from 'react-nice-avatar'

import React, { useState } from 'react';
type Ranking = {
    // total_rarity: number;
    // position: number;
    // user: {
    //     username: string;
    //     picture: string;
    //     id: string;
    // }
    username: string,
    picture: string,
    id: number,
    rarityPoints: number,
}
export function RankingView({
    data,
}: {
    data: Ranking[]
}) {
    const [ranking, setRanking] = useState<Ranking[]>(data)
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const { get, loading } = useApi()
    const next = async () => {
        const res = await get(`/ranking?page=${page + 1}`);
        setRanking([...ranking, ...res.data.data])
        setPage((prev) => prev + 1);

        if (res.data.data.length < 3) {
            console.log('AAAA')
            setHasMore(false);
        }
    };
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 font-syne">Ranking dos Top {ranking.length}.</h1>
            <div className="space-y-4">
                {ranking.map((ranking, index) => (
                    <Card key={index} className=' *:font-syne'>
                        <CardHeader className="flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-semibold">#{++index}</CardTitle>
                            {/* <Avatar className="ml-4">
                                <AvatarImage className=" object-cover" src={ranking.user.picture} alt={ranking.user.username} />
                                <AvatarFallback>{ranking.user.username[0]}</AvatarFallback>
                            </Avatar> */}
                            <NiceAvatar className='h-12 w-12 ml-4' {...genConfig(ranking.username)} />
                            <div className="ml-4 flex-grow w-4/12">
                                <CardTitle className="text-lg truncate w-11/12">{ranking.username}</CardTitle>
                            </div>
                            <div className="text-right">
                                <CardTitle className="text-lg font-bold">{ranking.rarityPoints}</CardTitle>
                                <p className="text-sm text-muted-foreground">Pontos de raridade</p>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
                <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
                    {hasMore && <Loader2 className="my-4 size-12 mx-auto animate-spin" />}
                </InfiniteScroll>
            </div>
        </div>
    )
}