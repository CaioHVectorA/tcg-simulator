"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gift, Zap, Package, Sparkles } from "lucide-react"

const SECTIONS = [
    { id: "bounty", label: "Recompensa", icon: Gift },
    { id: "flashcards", label: "Promoções", icon: Zap },
    { id: "standard", label: "Padrão", icon: Package },
    { id: "themed", label: "Temáticos", icon: Sparkles },
]

export function Navigation() {
    const [activeSection, setActiveSection] = useState("bounty")

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 180
            for (const section of SECTIONS) {
                const element = document.getElementById(section.id)
                if (element) {
                    const top = element.offsetTop
                    const height = element.offsetHeight
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveSection(section.id)
                        break
                    }
                }
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollTo = (id: string) => {
        setActiveSection(id)
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    return (
        <nav className="sticky top-2 sm:top-3 z-40 mx-auto max-w-full w-fit mb-4 sm:mb-6 px-1">
            <div className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-sm max-w-[calc(100vw-1.5rem)] overflow-x-auto scrollbar-none whitespace-nowrap">
                {SECTIONS.map((sec) => {
                    const Icon = sec.icon
                    const isActive = activeSection === sec.id
                    return (
                        <button
                            key={sec.id}
                            onClick={() => scrollTo(sec.id)}
                            className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs md:text-sm font-semibold shrink-0 transition-colors duration-150 ${
                                isActive ? "text-white dark:text-black" : "text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNavTab"
                                    className="absolute inset-0 bg-black dark:bg-white rounded-full -z-10 shadow-sm"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className="size-3.5 shrink-0" />
                            <span>{sec.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}