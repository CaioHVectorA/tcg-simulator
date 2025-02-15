"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useMemo } from "react";
type Quest = {
    name: string;
    description: string;
    id: number,
    total: number;
    progress: number;
    completed: boolean;
    currentLevel: number;
    fullCompleted: boolean;
    actualReward: number;

    isDiary: boolean;
}
function Quest({ quest, mutate }: { quest: Quest, mutate: any }) {
    return (
        <Card>
            <CardHeader>
                <div className=" justify-between flex">
                    <CardTitle className="text-lg">{quest.name}</CardTitle>
                    {quest.fullCompleted ? (
                        <Badge variant={'default'} className=" rounded-full">
                            <Check />
                        </Badge>
                    ) : (
                        <Badge variant={'outline'} className=" rounded-full">{quest.currentLevel}</Badge>
                    )}
                </div>
                <CardDescription>{quest.description}</CardDescription>
            </CardHeader>
            {quest.fullCompleted ? (
                <>
                    <CardContent>
                        <Progress value={100} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Progresso: {quest.progress} / {quest.total}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" disabled>Recompensa Coletada</Button>
                    </CardFooter>
                </>
            ) : (
                <>
                    <CardContent>
                        <Progress value={Math.min((quest.progress / quest.total) * 100, 100)} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Progresso: {quest.progress} / {quest.total}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Badge variant="secondary">Recompensa: {quest.actualReward}</Badge>
                        {quest.completed ? (
                            <Button onClick={() => mutate(quest.id)}>Coletar Recompensa</Button>
                        ) : (
                            <Button variant="outline" disabled>Em Progresso</Button>
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
export function Quests() {
    const { get, post, patch } = useApi()
    const { data, isLoading, refetch } = useQuery<Quest[]>({
        queryKey: ['quests'],
        queryFn: async () => {
            const res = await get('/quests')
            if (res.data.data.length > 0 && res.data.data.length !== 3) return res.data.data
            const setup = await post('/quests/setup', {})
            const newRes = await get('/quests')
            return newRes.data.data
        }
    })
    const qClient = useQueryClient()
    const { mutateAsync, isPending: isMutating } = useMutation({
        mutationKey: ['quests', 'claim'],
        mutationFn: async (id: number) => {
            if (isMutating) return
            const res = await patch(`/quests/get-reward/${id}`, {})
            await qClient.invalidateQueries({ queryKey: ['user'] })
            await qClient.refetchQueries({ queryKey: ['user'] })
            await refetch()
            return res.data.data
        }
    })
    if (isLoading || !data) return <p>Carregando...</p>
    const diaryQuests = data.filter(d => d.isDiary)
    const commonQuests = data.filter(d => !d.isDiary)
    return (
        <>
            <div className=" md:col-span-2 lg:col-span-3 font-syne">
                <h2 className="text-3xl font-bold mt-4">Missões</h2>
                {/* <p className="text-sm text-muted-foreground">Missões Completadas: {totalCompleted} / {data.length}</p> */}
                {/* <p className="text-sm text-muted-foreground">Recompensas Coletadas: {totalClaims} / {data.length}</p> */}
            </div>
            <h3 className="text-xl font-bold md:col-span-2 lg:col-span-3 font-syne">Missões diárias</h3>

            {/* {commonQuests.sort((a, b) => Number(a.fullCompleted) - Number(b.fullCompleted)).map((quest, index) => (
                <Card key={quest.id}>
                    <CardHeader>
                        <div className=" justify-between flex">
                            <CardTitle className="text-lg">{quest.name}</CardTitle>
                            {quest.fullCompleted ? (
                                <Badge variant={'default'} className=" rounded-full">
                                    <Check />
                                </Badge>
                            ) : (
                                <Badge variant={'outline'} className=" rounded-full">{quest.currentLevel}</Badge>
                            )}
                        </div>
                        <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    {quest.fullCompleted ? (
                        <>
                            <CardContent>
                                <Progress value={100} className="mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Progresso: {quest.progress} / {quest.total}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" disabled>Recompensa Coletada</Button>
                            </CardFooter>
                        </>
                    ) : (
                        <>
                            <CardContent>

                                <Progress value={Math.min((quest.progress / quest.total) * 100, 100)} className="mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Progresso: {quest.progress} / {quest.total}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Badge variant="secondary">Recompensa: {quest.actualReward}</Badge>
                                {quest.completed ? (
                                    <Button onClick={() => {
                                        if (isMutating) return
                                        mutateAsync(quest.id)
                                    }}>Coletar Recompensa</Button>
                                ) : (
                                    <Button variant="outline" disabled>Em Progresso</Button>
                                )}
                            </CardFooter>
                        </>
                    )}
                </Card>
            ))} */}
            {diaryQuests.map((quest, index) => (
                <Quest key={quest.id} quest={quest} mutate={mutateAsync} />
            ))}
            <Separator className=" col-span-3 mt-2" />
            <h3 className="text-xl font-bold md:col-span-2 lg:col-span-3 font-syne">Missões Comuns</h3>
            {commonQuests.map((quest, index) => (
                <Quest key={quest.id} quest={quest} mutate={mutateAsync} />
            ))}
        </>
    )
}