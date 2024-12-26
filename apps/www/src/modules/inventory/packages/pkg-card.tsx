"use client"
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NumberQuantityInput } from "@/components/ui/quantity-input";
import { loadTcgImg } from "@/lib/load-tcg-img";
import Link from "next/link";
import { useState } from "react";
import { OpenPackagePopup } from "./open-popup";
export function PackageCard({ pack }: { pack: UserPackage }) {
    const [quantity, setQuantity] = useState(1);
    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle className="text-lg">{pack.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <img src={loadTcgImg(pack.image_url)} alt={pack.name} className="w-full aspect-[1/1.4] object-contain rounded-md" />
            </CardContent>
            <CardFooter>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button className="w-full">Abrir Pacote</Button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                        <h2>Quantos pacotes você quer abrir?</h2>
                        <NumberQuantityInput
                            defaultValue={quantity}
                            max={pack.quantity}
                            onChange={(value) => setQuantity(value)}
                            min={1}
                        />
                        {/* <Button className="w-full mt-2">
                            Abrir
                        </Button> */}
                        <OpenPackagePopup pack={pack} quantity={quantity} />
                    </PopoverContent>
                </Popover>
            </CardFooter>
            <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-background border shadow-sm text-primary-foreground rounded-full p-1 aspect-square min-w-8 min-h-8 flex items-center justify-center font-bold">
                <p>{pack.quantity}</p>
            </div>
        </Card>
    )
}