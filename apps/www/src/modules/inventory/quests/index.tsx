import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
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
}
export function Quests() {
    const { get, post, patch } = useApi()
    const { data, isLoading, refetch } = useQuery<Quest[]>({
        queryKey: ['quests'],
        queryFn: async () => {
            const res = await get('/quests')
            if (res.data.data.length > 0) return res.data.data
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
            refetch()
            qClient.invalidateQueries({ queryKey: ['user'] })
            qClient.refetchQueries({ queryKey: ['user'] })
            return res.data.data
        }
    })
    if (isLoading || !data) return <p>Carregando...</p>
    return (
        <>
            {data.sort((a, b) => Number(a.fullCompleted) - Number(b.fullCompleted)).map((quest, index) => (
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
            ))}
        </>
    )
}