import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, TooltipTrigger, Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { Package, Book, Trophy } from "lucide-react";
import { PackageCard } from '../packages/pkg-card'
export function InventoryPage({
    data
}: {
    data: UserPackage[]
}) {
    return (
        <div className="container mx-auto px-4 py-8 font-syne">
            <h1 className="text-3xl font-bold mb-8">Seu Inventário</h1>

            <Tabs defaultValue="packages" className="mb-12">
                <TabsList>
                    <TabsTrigger value="packages">
                        <Package className="mr-2 h-4 w-4" />
                        Pacotes
                    </TabsTrigger>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>

                                    <TabsTrigger disabled value="albums">
                                        <Book className="mr-2 h-4 w-4" />
                                        Álbuns
                                    </TabsTrigger>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Em breve</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>

                                    <TabsTrigger disabled value="quests">
                                        <Trophy className="mr-2 h-4 w-4" />
                                        Missões
                                    </TabsTrigger>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Em breve</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                </TabsList>
                <TabsContent value="packages">
                    <h2 className="text-2xl font-bold mb-4">Seus Pacotes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.map((pack, index) => (
                            <PackageCard key={pack.id + index} pack={pack} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="quests">
                    <h2 className="text-2xl font-bold mb-4">Missões Ativas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* {quests.map((quest) => (
                            <QuestCard key={quest.id} quest={quest} />
                        ))} */}
                    </div>
                </TabsContent>
                <TabsContent value="albums">
                    <h2 className="text-2xl font-bold mb-4">Seus Álbuns</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* {albums.map((album) => (
                            <AlbumCard key={album.id} album={album} />
                        ))} */}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}