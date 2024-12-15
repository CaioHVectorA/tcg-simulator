"use client"

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { KartProvider, useKart } from "./use-kart";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { LoadingRing } from "@/components/loading-spinner";

export function KartFloating() {
    const { kart, checkout, loading } = useKart()
    const total = kart.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const [open, setOpen] = useState(false)
    return (
        <Sheet open={open}>
            {kart.length > 0 && <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} className=" rounded-full fixed bottom-6 w-12 hover:bg-background hover:shadow-sm border-gray-200 border-none shadow-sm h-12 aspect-square left-6 z-[999] bg-background">
                    <ShoppingCart className="text-foreground min-h-5 min-w-5" />
                </Button>
            </SheetTrigger>}
            <SheetContent className=" font-syne flex flex-col justify-between">
                <SheetHeader>
                    <SheetTitle className=" font-syne font-bold">Seu carrinho</SheetTitle>
                    <SheetDescription>Veja e edite seus itens</SheetDescription>
                    {kart.map((item) => (
                        <div key={item.id} className="grid grid-cols-3 gap-4 py-4">
                            <div className="col-span-2">
                                <h1 className="font-bold">{item.quantity}x {item.name}</h1>
                            </div>
                            <div className="flex justify-end items-center">
                                <span><b>{balanceTranslate(item.price * item.quantity)}</b></span>
                            </div>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center">
                        <span>Total:</span>
                        <span className="font-bold">{balanceTranslate(total)}</span>
                    </div>
                </SheetHeader>
                <SheetFooter>
                    <Button onClick={() => checkout(setOpen)} className="w-full">
                        {loading ? <LoadingRing /> : "Finalizar compra"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
