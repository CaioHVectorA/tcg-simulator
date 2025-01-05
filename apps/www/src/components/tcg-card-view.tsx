"use client"
import { loadTcgImg } from "@/lib/load-tcg-img"
import Image from "next/image"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "./ui/dialog"
import { Cross } from "lucide-react"
import { Cross1Icon } from "@radix-ui/react-icons"
import { LoadingRing } from "./loading-spinner"

export function TcgCard({
    url
}: {
    url: string
}) {
    return (
        <Dialog>
            <DialogTrigger>
                <div className="relative aspect-[1/1.4] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <img
                        src={loadTcgImg(url, true)}
                        alt="card"
                        className="rounded-lg object-cover w-full h-full"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="py-4 bg-black/05 backdrop-blur-sm border-none text-white">
                <DialogTitle className=" sr-only">Detalhes</DialogTitle>
                <div className="relative aspect-[1/1.4] max-h-[90vh] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <img
                        src={loadTcgImg(url)}
                        alt="card"
                        className="rounded-lg object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}