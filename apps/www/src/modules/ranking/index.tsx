"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InfiniteScroll from '@/components/ui/infinite-scroll';
import { useApi } from '@/hooks/use-api';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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
    const [isSyncing, setIsSyncing] = useState(false);
    const { get, post, loading } = useApi();
    const { toast } = useToast();
    const baseUrl = tab === 'rarity' ? '/ranking/rarity' : '/ranking/budget';

    useEffect(() => {
        let mounted = true;
        setPage(1);
        setHasMore(true);
        (async () => {
            try {
                const res = await get(`${baseUrl}?page=1`);
                if (mounted && res?.data?.data) {
                    setRanking(Array.isArray(res.data.data) ? res.data.data : []);
                    if (res.data.data.length < 3) {
                        setHasMore(false);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar ranking:", err);
            }
        })();
        return () => { mounted = false; };
    }, [tab]);

    const handleSyncRarity = async () => {
        setIsSyncing(true);
        try {
            const res = await post("/ranking/sync", {});
            toast({
                title: "Pontos Sincronizados!",
                description: `Seus pontos de raridade foram atualizados para ${res?.data?.data?.rarityPoints ?? 0}.`,
            });
            const refreshed = await get(`${baseUrl}?page=1`);
            if (refreshed?.data?.data) {
                setRanking(refreshed.data.data);
            }
        } catch (err) {
            toast({
                title: "Falha na sincronização",
                description: "Não foi possível recalcular seus pontos no momento.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const next = async () => {
        const nextPage = page + 1;
        const res = await get(`${baseUrl}?page=${nextPage}`);
        const newItems = res?.data?.data ?? [];
        if (Array.isArray(newItems) && newItems.length > 0) {
            setRanking((prev) => [...prev, ...newItems]);
            setPage(nextPage);
        }
        if (!newItems || newItems.length < 3) {
            setHasMore(false);
        }
    };
    return (
        <Tabs value={tab} onValueChange={setTab}>
            <div className="container mx-auto px-4 py-8 *:font-syne">
                <div className=' w-full flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6'>
                    <div>
                        <h1 className="text-3xl font-bold">Ranking</h1>
                        {ranking.length > 0 && <p className='text-sm text-muted-foreground mt-1'> dos Top {ranking.length} {tab == 'rarity' ? 'Colecionadores' : 'Magnatas'} </p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {tab === 'rarity' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSyncRarity}
                                disabled={isSyncing}
                                className="font-sans text-xs gap-1.5 rounded-xl border-border"
                            >
                                <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                Sincronizar Meus Pontos
                            </Button>
                        )}
                        <TabsList>
                            <TabsTrigger value='rarity'>Colecionadores</TabsTrigger>
                            <TabsTrigger value='monetary'>Magnatas</TabsTrigger>
                        </TabsList>
                    </div>
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