"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, Package, ArrowRight, ShoppingBag, FolderOpen } from "lucide-react"
import { useRouter } from "next/navigation"

type PurchaseSuccessModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    itemCount?: number
}

export function PurchaseSuccessModal({ open, onOpenChange, itemCount = 1 }: PurchaseSuccessModalProps) {
    const router = useRouter()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-syne bg-zinc-950 text-white border-zinc-800 max-w-sm sm:max-w-md rounded-2xl p-6 text-center shadow-2xl">
                <DialogHeader className="items-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/20 to-purple-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-xl relative"
                    >
                        <Package className="size-8 sm:size-10 text-white" />
                        <Sparkles className="size-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                    </motion.div>

                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-wide text-white">
                        Compra Realizada! 🎉
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
                        Seus {itemCount} {itemCount === 1 ? 'item' : 'itens'} já foram entregues com sucesso na sua conta.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-4">
                    <Button 
                        onClick={() => {
                            onOpenChange(false)
                            router.push('/inventario')
                        }}
                        className="w-full py-5 text-xs sm:text-sm font-extrabold gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20"
                    >
                        <FolderOpen className="size-4" />
                        <span>Abrir Pacotes no Inventário</span>
                        <ArrowRight className="size-4" />
                    </Button>

                    <Button 
                        onClick={() => onOpenChange(false)}
                        variant="outline"
                        className="w-full py-4 text-xs font-bold text-zinc-200 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white"
                    >
                        <ShoppingBag className="size-3.5 mr-1" />
                        <span>Continuar Comprando</span>
                    </Button>
                </div>


            </DialogContent>
        </Dialog>
    )
}
