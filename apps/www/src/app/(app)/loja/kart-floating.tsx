"use client"

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useKart } from "./use-kart";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Coins, ArrowRight, ShoppingBag, ChevronUp } from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";
import { useState } from "react";
import { LoaderSimple } from "@/components/loading-spinner";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseSuccessModal } from "./purchase-success-modal";

export function KartFloating() {
    const { kart, checkout, loading, removeItem, editItem, successModalOpen, setSuccessModalOpen, lastPurchasedCount } = useKart()
    const total = kart.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const totalItems = kart.reduce((acc, item) => acc + item.quantity, 0)
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Purchase Success Modal with high Pokémon TCG identity */}
            <PurchaseSuccessModal 
                open={successModalOpen}
                onOpenChange={setSuccessModalOpen}
                itemCount={lastPurchasedCount}
            />

            {kart.length > 0 && (
                <>
                    {/* Direct Mobile-First Responsive Bottom Cart Bar */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-3 left-2 right-2 sm:left-auto sm:right-6 sm:w-96 z-[990] max-w-[calc(100vw-1rem)]"
                    >
                        <div className="bg-zinc-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-zinc-800 flex items-center justify-between gap-2">
                            <button 
                                onClick={() => setOpen(true)} 
                                className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left group hover:opacity-90 transition-opacity"
                            >
                                <div className="size-9 sm:size-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center relative shrink-0">
                                    <ShoppingBag className="size-4 sm:size-5 text-white" />
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center border border-zinc-900 leading-none">
                                        {totalItems}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-0.5">
                                        <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                                        <ChevronUp className="size-3 text-zinc-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white truncate">
                                        <Coins className="size-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
                                        <span className="truncate">{balanceTranslate(total)}</span>
                                    </div>
                                </div>
                            </button>

                            <Button 
                                onClick={async () => {
                                    await checkout(setOpen)
                                }} 
                                disabled={loading}
                                size="sm"
                                className="bg-white text-zinc-900 hover:bg-zinc-100 font-bold px-3 sm:px-4 py-1.5 h-8 sm:h-9 rounded-xl text-xs gap-1 shrink-0 shadow-xs"
                            >
                                {loading ? (
                                    <LoaderSimple />
                                ) : (
                                    <>
                                        <span>Finalizar</span>
                                        <ArrowRight className="size-3.5 shrink-0" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Clean Light Cart Sheet */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetContent className="font-syne flex flex-col justify-between bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 border-l border-zinc-200 dark:border-zinc-800 w-full sm:max-w-md p-4 sm:p-6">
                            <SheetHeader className="pb-2">
                                <SheetTitle className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                    <ShoppingBag className="size-5 text-primary" />
                                    <span>Seu Carrinho</span>
                                </SheetTitle>
                                <SheetDescription className="text-zinc-500 text-xs">
                                    Revise e edite a quantidade dos seus itens.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2">
                                <AnimatePresence>
                                    {kart.map((item) => (
                                        <motion.div
                                            key={`${item.type}-${item.id}`}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0, x: -30 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h4>
                                                <div className="flex items-center gap-1 font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-0.5">
                                                    <Coins className="size-3 text-amber-500 fill-amber-500/20 shrink-0" />
                                                    <span>{balanceTranslate(item.price * item.quantity)}</span>
                                                    <span className="text-zinc-400 font-normal text-[10px] sm:text-[11px] truncate">({balanceTranslate(item.price)} un)</span>
                                                </div>
                                            </div>

                                            {/* Inline Quantity Controls */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="flex items-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                                        onClick={() => editItem(item.id, { quantity: item.quantity - 1 })}
                                                    >
                                                        <Minus className="size-3" />
                                                    </Button>
                                                    <span className="w-5 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                                        onClick={() => editItem(item.id, { quantity: item.quantity + 1 })}
                                                    >
                                                        <Plus className="size-3" />
                                                    </Button>
                                                </div>

                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => removeItem(item.id)} 
                                                    className="size-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg shrink-0"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="pt-3 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Total:</span>
                                    <div className="flex items-center gap-1 font-bold text-zinc-900 dark:text-zinc-50 text-lg sm:text-xl">
                                        <Coins className="size-4 sm:size-5 text-amber-500 fill-amber-500/20" />
                                        <span>{balanceTranslate(total)}</span>
                                    </div>
                                </div>

                                <SheetFooter>
                                    <Button 
                                        onClick={async () => {
                                            await checkout(setOpen)
                                        }} 
                                        disabled={loading}
                                        className="w-full font-bold text-xs sm:text-sm gap-2 h-10"
                                    >
                                        {loading ? (
                                            <LoaderSimple />
                                        ) : (
                                            <>
                                                <span>Finalizar Compra</span>
                                                <ArrowRight className="size-4" />
                                            </>
                                        )}
                                    </Button>
                                </SheetFooter>
                            </div>
                        </SheetContent>
                    </Sheet>
                </>
            )}
        </>
    );
}
