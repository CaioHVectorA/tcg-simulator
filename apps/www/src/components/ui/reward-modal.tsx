"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Gift, Coins, CheckCircle2, Sparkles, Trophy } from "lucide-react"
import { balanceTranslate } from "@/lib/balance-translate"

type RewardModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    rewardAmount?: number
    iconType?: "bounty" | "quest" | "general"
}

export function RewardModal({
    open,
    onOpenChange,
    title = "Recompensa Coletada!",
    description = "Sua recompensa já foi adicionada ao seu saldo de moedas.",
    rewardAmount,
    iconType = "general"
}: RewardModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="font-syne bg-zinc-950 text-white border-zinc-800 max-w-sm sm:max-w-md rounded-2xl p-6 text-center shadow-2xl">
                <DialogHeader className="items-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-xl relative"
                    >
                        {iconType === "bounty" && <Gift className="size-8 sm:size-10 text-amber-400" />}
                        {iconType === "quest" && <Trophy className="size-8 sm:size-10 text-amber-400" />}
                        {iconType === "general" && <Coins className="size-8 sm:size-10 text-amber-400" />}
                        <Sparkles className="size-5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                    </motion.div>

                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-wide text-white">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {rewardAmount !== undefined && rewardAmount > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="my-3 py-3 px-4 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center gap-2"
                    >
                        <Coins className="size-5 text-amber-400 fill-amber-400/20" />
                        <span className="text-xl sm:text-2xl font-black text-amber-400">
                            +{balanceTranslate(rewardAmount)}
                        </span>
                        <span className="text-xs text-zinc-400 font-semibold">moedas</span>
                    </motion.div>
                )}

                <div className="mt-4">
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="w-full py-5 text-xs sm:text-sm font-extrabold gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20"
                    >
                        <CheckCircle2 className="size-4" />
                        <span>Excelente!</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
