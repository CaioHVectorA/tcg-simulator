import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";

export function AlbumCard({ album }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{album.name}</CardTitle>
                <CardDescription>{album.cardCount} cards</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <span>{album.likes} curtidas</span>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Share2 className="mr-2 h-4 w-4" />
                                Compartilhar
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Compartilhar Álbum</DialogTitle>
                                <DialogDescription>
                                    Compartilhe seu álbum "{album.name}" com outros jogadores!
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://pokemon-tcg-sim.com/album/${album.id}`}
                                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                                />
                                <Button>Copiar Link</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}