"use client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, TooltipTrigger, Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { Package, Book, Trophy, ExternalLink } from "lucide-react";
import { PackageCard } from '../packages/pkg-card'
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quests } from "../quests";
export function InventoryPage({
    data: initialData
}: {
    data: UserPackage[]
}) {
    const { get } = useApi()
    const { data } = useQuery<UserPackage[]>({
        initialData,
        queryKey: ['packages'], queryFn: async () => {
            const res = await get('/packages')
            return res.data.data ?? res.data
        }
    });
    return (
        <div className="container mx-auto px-4 py-8 font-syne">
            <h1 className="text-3xl font-bold mb-8">Seu Inventário</h1>

            <Tabs defaultValue="packages" className="mb-12">
                <TabsList>
                    <TabsTrigger value="packages">
                        <Package className="mr-2 h-4 w-4" />
                        Pacotes
                    </TabsTrigger>
                    <TabsTrigger value="quests">
                        <Trophy className="mr-2 h-4 w-4" />
                        Missões
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
                </TabsList>
                <TabsContent value="packages">
                    <h2 className="text-2xl font-bold mb-4">Seus Pacotes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.map((pack, index) => (
                            <PackageCard key={pack.id + index} pack={pack} />
                        ))}
                    </div>
                    {data.length === 0 && (
                        <div className="text-center mt-8">
                            <h3 className=" text-2xl">Você ainda não possui nenhum pacote!</h3>
                            <p className="text-lg mt-4">Compre pacotes na loja para começar a colecionar!</p>
                            <Button asChild className=" mt-2"><Link href={'/loja'}>Ir para a loja <ExternalLink /></Link></Button>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="quests">
                    <h2 className="text-2xl font-bold mb-4">Missões Ativas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Quests />
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