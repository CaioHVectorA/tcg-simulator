'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { reportError } from '../../actions/reportError'

export default function PaginaDeErro() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        const result = await reportError(formData)
        setIsSubmitting(false)

        if (result.success) {
            toast({
                title: "Relatório enviado",
                description: "Obrigado por nos ajudar a melhorar o jogo!",
            })
        } else {
            toast({
                title: "Erro ao enviar",
                description: "Desculpe, não foi possível enviar o relatório. Tente novamente mais tarde.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Ops! Algo deu errado</CardTitle>
                    <CardDescription className="text-center">
                        Não se preocupe, não é culpa sua. Nossos Pokémon estão trabalhando duro para resolver isso!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center mb-4">
                        <p className="text-lg">Desculpe pelo inconveniente. Enquanto isso, que tal voltar para a página inicial e explorar mais do nosso jogo?</p>
                    </div>
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Ajude-nos a melhorar!</h3>
                            <p className="text-sm mb-2">Conte-nos o que aconteceu. Sua experiência nos ajuda a tornar o jogo ainda melhor para todos os treinadores!</p>
                            <Textarea
                                name="description"
                                placeholder="Descreva o que você estava fazendo quando o erro ocorreu..."
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Enviar Relatório"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild variant="outline">
                        <Link href="/">Voltar para a Página Inicial</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

