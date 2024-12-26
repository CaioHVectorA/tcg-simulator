import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
type Quest = {
    name: string;
    description: string;
    progress: number;
    total: number;
    reward: string;
    pokemonNeeded?: string[];
}
export function QuestCard({ quest }: { quest: Quest }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{quest.name}</CardTitle>
                <CardDescription>{quest.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={(quest.progress / quest.total) * 100} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                    Progresso: {quest.progress} / {quest.total}
                </p>
                {quest.pokemonNeeded && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Pokémon necessários:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {quest.pokemonNeeded.map((pokemon, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={`https://picsum.photos/seed/${pokemon}/100/140`}
                                        alt={pokemon}
                                        className={`w-full aspect-[1/1.4] object-cover rounded-md ${quest.progress > index ? 'opacity-100' : 'opacity-50 grayscale'}`}
                                    />
                                    <Badge
                                        variant={quest.progress > index ? "default" : "secondary"}
                                        className="absolute bottom-1 left-1 right-1 text-center"
                                    >
                                        {pokemon}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Badge variant="secondary">Recompensa: {quest.reward}</Badge>
                {quest.progress === quest.total ? (
                    <Button>Coletar Recompensa</Button>
                ) : (
                    <Button variant="outline" disabled>Em Progresso</Button>
                )}
            </CardFooter>
        </Card>
    )
}