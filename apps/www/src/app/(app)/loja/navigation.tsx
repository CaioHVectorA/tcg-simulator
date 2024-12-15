"use client"
import { useState } from "react"

export function Navigation() {
    const [actualSection, setActualSection] = useState(1)
    // desativado por enquanto
    return null
    return (
        <nav className=" fixed bottom-4 right-4 z-[999] bg-black px-2 py-3 rounded-lg">
            <ul className=" flex items-center gap-2 text-white font-syne">
                <li><a href="#flashcards">Promoções</a></li>
                <li><a href="#standard">Padrão</a></li>
                <li><a href="#themed">Temáticos</a></li>
            </ul>
        </nav>
    )
}