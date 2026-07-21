"use client"
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { RewardModal } from "@/components/ui/reward-modal";

type Quest = {
    name: string;
    description: string;
    id: number;
    total: number;
    progress: number;
    completed: boolean;
    currentLevel: number;
    fullCompleted: boolean;
    actualReward: number;
    isDiary: boolean;
}

function QuestCard({ quest, onClaim }: { quest: Quest, onClaim: (quest: Quest) => void }) {
    return (
        <Card className="border border-border bg-card shadow-xs rounded-xl font-syne">
            <CardHeader className="p-4 sm:p-5">
                <div className="justify-between flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-bold text-black dark:text-white">{quest.name}</CardTitle>
                    {quest.fullCompleted ? (
                        <Badge variant={'default'} className="rounded-full bg-emerald-600">
                            <Check className="size-3.5" />
                        </Badge>
                    ) : (
                        <Badge variant={'outline'} className="rounded-full font-mono">{quest.currentLevel}</Badge>
                    )}
                </div>
                <CardDescription className="text-xs mt-1 text-muted-foreground">{quest.description}</CardDescription>
            </CardHeader>

            {quest.fullCompleted ? (
                <>
                    <CardContent className="p-4 sm:p-5 pt-0">
                        <Progress value={100} className="mb-2 h-2" />
                        <p className="text-xs text-muted-foreground">
                            Progresso: {quest.progress} / {quest.total}
                        </p>
                    </CardContent>
                    <CardFooter className="p-4 sm:p-5 pt-0 flex justify-between">
                        <Button variant="outline" disabled size="sm" className="w-full text-xs">Recompensa Coletada</Button>
                    </CardFooter>
                </>
            ) : (
                <>
                    <CardContent className="p-4 sm:p-5 pt-0">
                        <Progress value={Math.min((quest.progress / quest.total) * 100, 100)} className="mb-2 h-2" />
                        <p className="text-xs text-muted-foreground">
                            Progresso: {quest.progress} / {quest.total}
                        </p>
                    </CardContent>
                    <CardFooter className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            +{quest.actualReward} Moedas
                        </Badge>
                        {quest.completed ? (
                            <Button size="sm" className="font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950" onClick={() => onClaim(quest)}>
                                Coletar Recompensa
                            </Button>
                        ) : (
                            <Button variant="outline" disabled size="sm" className="text-xs">Em Progresso</Button>
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    )
}

export function Quests() {
    const { get, post, patch } = useApi()
    const [rewardModalOpen, setRewardModalOpen] = useState(false)
    const [rewardAmount, setRewardAmount] = useState<number | null>(null)
    const [rewardTitle, setRewardTitle] = useState("")

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
        mutationFn: async (quest: Quest) => {
            if (isMutating) return
            const res = await patch(`/quests/get-reward/${quest.id}`, {})
            setRewardAmount(quest.actualReward)
            setRewardTitle(`Missão Concluída: ${quest.name}`)
            setRewardModalOpen(true)
            await qClient.invalidateQueries({ queryKey: ['user'] })
            await qClient.refetchQueries({ queryKey: ['user'] })
            await refetch()
            return res.data.data
        }
    })

    const handleClaim = (quest: Quest) => {
        mutateAsync(quest)
    }

    if (isLoading || !data) return <p className="font-syne text-muted-foreground p-4">Carregando missões...</p>
    const diaryQuests = data.filter(d => d.isDiary)
    const commonQuests = data.filter(d => !d.isDiary)

    return (
        <>
            <div className="md:col-span-2 lg:col-span-3 font-syne">
                <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-black dark:text-white">Missões</h2>
            </div>
            <h3 className="text-lg sm:text-xl font-bold md:col-span-2 lg:col-span-3 font-syne text-black dark:text-white">Missões Diárias</h3>

            {diaryQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={handleClaim} />
            ))}
            <Separator className="col-span-full my-2" />
            <h3 className="text-lg sm:text-xl font-bold md:col-span-2 lg:col-span-3 font-syne text-black dark:text-white">Missões Comuns</h3>
            {commonQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={handleClaim} />
            ))}

            <RewardModal 
                open={rewardModalOpen}
                onOpenChange={setRewardModalOpen}
                iconType="quest"
                title="Recompensa de Missão! 🏆"
                description={rewardTitle}
                rewardAmount={rewardAmount || undefined}
            />
        </>
    )
}