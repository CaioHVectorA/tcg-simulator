'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/use-api'

export default function SpecialEventGengar() {
    const [showCard, setShowCard] = useState(false)

    useEffect(() => {
        // Delay the card reveal
        const timer = setTimeout(() => setShowCard(true), 1000)
        return () => clearTimeout(timer)
    }, [])
    const { post } = useApi()
    const { push } = useRouter()
    const handleClaim = async () => {
        // Here you would typically call an API to claim the card
        const res = await post('/special/gengar/claim', {})
        push('/colecao')
    }

    return (
        <div className=' bg-[url(/wallpaper.jpg)] bg-center bg-cover'>
            <div className="min-h-screen bg-gradient-to-br backdrop-blur-sm px-[20%] pt-8 from-zinc-600/80 to-indigo-900/80 flex flex-col items-center justify-center p-4 overflow-hidden">
                <motion.h1
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-4xl md:text-6xl font-bold text-white mb-6 text-center"
                >
                    Resgate seu Gengar Ex!
                </motion.h1>

                <AnimatePresence>
                    {showCard && (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                duration: 2
                            }}
                            className="relative mx-auto mb-8"
                        >
                            <img
                                src="/gengar-card.webp"
                                alt="Gengar Card"
                                className="rounded-lg h-96 object-cover shadow-2xl"
                            />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-transparent opacity-10"
                            />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                className="absolute inset-0 bg-gradient-to-l from-purple-500/40 to-transparent opacity-10"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.p
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                    className="text-3xl text-purple-200 mb-8 text-center"
                >
                    Não perca esta chance de adicionar o adorado <b>Gengar</b> à sua coleção!
                </motion.p>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.5 }}
                >
                    <Button
                        onClick={handleClaim}
                        className="bg-purple-500 text-2xl hover:bg-purple-600 text-white font-bold py-6 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Resgate o gengar
                    </Button>
                </motion.div>

                {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.5 }}
                className="mt-12"
                >
                <Link href="/">
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-purple-900 transition duration-300">
                Return to Home
                </Button>
                </Link>
                </motion.div> */}
            </div>
        </div>
    )
}

