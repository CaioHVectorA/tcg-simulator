import Link from "next/link"
import { Button } from "./ui/button"

export function Wip() {
    return (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground text-center p-4">
            <img src="/wip.png" alt="TCG Logo" className="rounded-full object-cover mx-auto" />
            <h1 className="text-2xl font-bold">Funcionalidade em construção</h1>
            <p className="mt-2 text-muted-foreground">Estamos trabalhando nela, volte mais tarde!</p>
        </div>
    )
}

export function LargeWip() {
    // full screen wip
    return (
        <div className="bg-background/95 backdrop-blur w-full h-screen supports-[backdrop-filter]:bg-background/60 text-foreground flex flex-col items-center justify-center p-6 text-center">
            <img src="/wip.png" alt="TCG Logo" className="rounded-full max-w-[40%] object-cover mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Funcionalidade em construção</h1>
            <p className="mt-2 text-muted-foreground">Estamos trabalhando nela, volte mais tarde!</p>
            <Button asChild className="mt-4">
                <Link href="/home">
                    Voltar para a Home
                </Link>
            </Button>
        </div >
    )
}