"use client"
import { LocalizedText, useUiText } from "@/i18n/localized-text";
import { TcgCardImage } from "./tcg-card-image"
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/dialog"

export function TcgCard({
    url
}: {
    url: string
}) {
  const ui = useUiText();
    return (
        <Dialog>
            <DialogTrigger>
                <div className="relative aspect-[1/1.4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <TcgCardImage
                        src={url}
                        alt={ui("card")}
                        lowQuality={true}
                        className="rounded-lg object-cover w-full h-full"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="py-4 bg-black/05 backdrop-blur-sm border-none text-white">
                <DialogTitle className=" sr-only"><LocalizedText text={"Detalhes"} /></DialogTitle>
                <div className="relative aspect-[1/1.4] max-h-[90vh] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <TcgCardImage
                        src={url}
                        alt={ui("card")}
                        className="rounded-lg object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
