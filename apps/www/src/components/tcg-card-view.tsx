"use client"
import { loadTcgImg } from "@/lib/load-tcg-img"
import Image from "next/image"
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/dialog"

export function TcgCard({
    url
}: {
    url: string
}) {
    return (
        <Dialog>
            <DialogTrigger>
                <div className="relative aspect-[1/1.4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <Image
                        src={loadTcgImg(url, true)}
                        alt="card"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                        placeholder="blur"
                        blurDataURL="/wallpaper.png"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none">
                <DialogTitle className=" sr-only">Detalhes</DialogTitle>
                <div className="relative aspect-[1/1.4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <Image
                        src={loadTcgImg(url)}
                        alt="card"
                        layout="fill"
                        objectFit="contain"
                        className="rounded-lg"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}