"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InfiniteScroll from '@/components/ui/infinite-scroll';
import { useApi } from '@/hooks/use-api';
import { Loader2 } from 'lucide-react';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { balanceTranslate } from '@/lib/balance-translate';
import { Avatar } from '@/components/avatar';
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
} | {
    username: string,
    picture: string,
    id: number,
    totalBudget: number,
}
export function RankingView({
    data,
}: {
    data: Ranking[]
}) {
    const [ranking, setRanking] = useState<Ranking[]>(data)
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [tab, setTab] = React.useState('rarity');
    const { get, loading } = useApi()
    const baseUrl = tab === 'rarity' ? '/ranking' : '/ranking/monetary'
    useLayoutEffect(() => {
        setRanking([])
        setPage(1)
        setHasMore(true);
        (async () => {
            const res = await get(`${baseUrl}?page=${page}`);
            setRanking(res.data.data)
            if (res.data.data.length < 3) {
                setHasMore(false);
            }
        })()
    }, [tab])
    const next = async () => {
        const res = await get(`${baseUrl}?page=${page + 1}`);
        setRanking([...ranking, ...res.data.data])
        setPage((prev) => prev + 1);

        if (res.data.data.length < 3) {
            console.log('AAAA')
            setHasMore(false);
        }
    };
    return (
        <Tabs value={tab} onValueChange={setTab}>
            <div className="container mx-auto px-4 py-8 *:font-syne">
                <div className=' w-full flex justify-between'>
                    <div>
                        <h1 className="text-3xl font-bold">Ranking</h1>
                        {ranking.length > 0 && <p className=' mb-6'> dos Top {ranking.length} {tab == 'rarity' ? 'Colecionadores' : 'Magnatas'} </p>}
                    </div>
                    <TabsList>
                        <TabsTrigger value='rarity'>Colecionadores</TabsTrigger>
                        <TabsTrigger value='monetary'>Magnatas</TabsTrigger>
                    </TabsList>
                </div>
                <div className="space-y-4">
                    {ranking.map((ranking, index) => (
                        <Card key={index} className=' *:font-syne'>
                            <CardHeader className="flex flex-row items-center space-y-0">
                                <CardTitle className="text-lg font-semibold">#{++index}</CardTitle>
                                <Avatar username={ranking.username} src={ranking.picture} className=' ml-4' />
                                {/* <NiceAvatar className='h-12 w-12 ml-4' {...genConfig(ranking.username)} /> */}
                                <div className="ml-4 flex-grow w-4/12">
                                    <CardTitle className="text-lg truncate w-11/12">{ranking.username}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <CardTitle className="text-lg font-bold">
                                        {'rarityPoints' in ranking ? ranking.rarityPoints : balanceTranslate(ranking.totalBudget) || 0}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {tab === 'rarity' ? '🏆 Pontos de raridade' : '🪙 Riqueza total'}
                                    </p>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                    <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
                        {hasMore && <Loader2 className="my-4 size-12 mx-auto animate-spin" />}
                    </InfiniteScroll>
                </div>
            </div>
        </Tabs>

    )
}