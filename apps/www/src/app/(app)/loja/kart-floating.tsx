"use client"

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { KartProvider, useKart } from "./use-kart";
import { Button } from "@/components/ui/button";
import { Edit, ShoppingCart, Trash } from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { LoadingRing } from "@/components/loading-spinner";
import { NumberQuantityInput } from "@/components/ui/quantity-input";
import Image from "next/image";

export function KartFloating() {
    const { kart, checkout, loading, removeItem, addItem, editItem, setKart } = useKart()
    const total = kart.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const handleClose = (open: boolean) => {
        setOpen(open)
        setEditMode(false)
    }
    const quantity = kart.reduce((acc, item) => acc + item.quantity, 0)
    return (
        <Sheet open={open} onOpenChange={handleClose}>
            {kart.length > 0 && <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} className=" rounded-full scale-125 fixed bottom-6 size-12 min-[1536px]:size-16 hover:bg-background hover:shadow-sm border-gray-400 border shadow-sm right-6 z-[999] bg-background">
                    <ShoppingCart className="text-foreground min-h-5 min-w-5 min-[1536px]:min-h-8 min-[1536px]:min-w-8" />
                    <span className="absolute -top-1 bg-red-600 -right-1 bg-primary text-background text-xs font-bold rounded-full size-5 min-[1536px]:size-7 min-[1536px]:-top-2 min-[1536px]:-right-2 min-[1536px]:text-sm flex justify-center items-center">{quantity}</span>
                </Button>
            </SheetTrigger>}
            {kart.length > 0 ? (

                <SheetContent className=" font-syne flex flex-col justify-between">
                    {!editMode ? (
                        <>
                            <SheetHeader>
                                <SheetTitle className=" font-syne font-bold">Seu carrinho</SheetTitle>
                                <SheetDescription>Veja e edite seus itens</SheetDescription>
                                {kart.map((item) => (
                                    <div key={item.id} className="grid grid-cols-3 items-start gap-4 py-4">
                                        <div className="col-span-2 gap-2">
                                            <h1 className="font-bold mb-2">{item.quantity}x {item.name}</h1>
                                            <Button size={'icon'} variant={'destructive'} onClick={() => removeItem(item.id)} className="text-xs"><Trash /></Button>
                                            <Button size={'icon'} onClick={() => setEditMode(true)} className="text-xs ml-2"><Edit /></Button>

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
                        </>
                    )
                        : (
                            <>
                                <SheetHeader>
                                    <SheetTitle className=" font-syne font-bold">Editar item</SheetTitle>
                                    <SheetDescription>Edite a quantidade do item</SheetDescription>
                                    {kart.map((item) => (
                                        <div key={item.id} className="grid grid-cols-4 gap-4 py-4">
                                            {/* <div className="col-span-2 gap-2">
                                            <h1 className="font-bold">{item.quantity}x {item.name}</h1>
                                        </div> */}
                                            <h1>{item.name}</h1>
                                            <NumberQuantityInput min={0} className="col-span-2" initialValue={item.quantity} onChange={(quantity) => editItem(item.id, { quantity })} />
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
                                    <Button onClick={() => setEditMode(false)} className="w-full">
                                        Terminar alterações
                                    </Button>
                                </SheetFooter>
                            </>
                        )}
                </SheetContent>
            ) : (
                <SheetContent className=" font-syne flex flex-col justify-between">
                    <SheetHeader>
                        <SheetTitle className="font-syne font-bold">Seu carrinho</SheetTitle>
                        <SheetDescription>Seu carrinho está vazio! Adicione algumas coisas para poder fechar o seu pedido</SheetDescription>
                        <img src={'/empty-cart.png'} className=" w-full" alt="Ilustração de Carrinho vazio" />
                    </SheetHeader>
                    <SheetFooter>
                        <Button onClick={() => setOpen(false)} className="w-full">
                            Continuar comprando
                        </Button>
                    </SheetFooter>
                </SheetContent>
            )}
        </Sheet>
    );
}
