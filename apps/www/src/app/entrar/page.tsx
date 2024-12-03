'use client'

import * as React from 'react'
import { useState } from 'react'
import { Mail, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Typewriter } from '@/modules/auth/typewriter'
import { useApi } from '@/hooks/use-api'
import { useToast } from '@/hooks/use-toast'
import { setCookie } from '@/lib/cookies'
import { useRouter } from 'next/navigation'

const loginSchema = z.object({
    email: z.string().email({ message: "Endereço de e-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
})

const registerSchema = z.object({
    username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres" }),
    email: z.string().email({ message: "Endereço de e-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
})

const LoginForm = ({ onSubmit }: {
    onSubmit: (values: z.infer<typeof loginSchema>) => void
}) => {
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="treinador@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Entrar</Button>
            </form>
        </Form>
    )
}

const RegisterForm = ({ onSubmit }: {
    onSubmit: (values: z.infer<typeof registerSchema>) => void
}) => {
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome de usuário</FormLabel>
                            <FormControl>
                                <Input placeholder="AshKetchum151" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="treinador@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Criar Conta</Button>
            </form>
        </Form>
    )
}

const GuestLoginDialog = ({ isOpen, onClose }: {
    isOpen: boolean
    onClose: () => void
}) => (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Entrar como Convidado</AlertDialogTitle>
                <AlertDialogDescription>
                    Você está prestes a entrar como convidado. Suas atividades serão limitadas e não serão salvas. Deseja continuar?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClose}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
)

export default function LoginRegisterPage() {
    const [activeTab, setActiveTab] = useState('login')
    const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false)
    const { post } = useApi()
    const { toast } = useToast()
    const { push } = useRouter()
    async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
        const response = await post('/auth/login', values)
        if (response.data.ok) {
            const token = response.data.data.token
            setCookie('token', token, 7)
            push('/home')
        }
    }

    async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
        const response = await post('/auth/register', values)
        if (response.data.ok) {
            const token = response.data.data.token
            setCookie('token', token, 7)
            push('/home')
        }
    }

    return (
        <div className="min-h-screen bg-cover bg-center flex items-center justify-center bg-blend-darken bg-[linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),url(/wallpaper.jpg)]">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-background/80 backdrop-blur-none rounded-lg p-8">
                <div className="flex flex-col max-md:hidden justify-center items-center bg-primary text-primary-foreground p-8 rounded-lg">
                    <img src="/logo.png" alt="TCG Logo" className="w-64 h-64 mb-4" />
                    <h1 className="text-7xl font-bold mb-2 text-white">SimTCG</h1>
                    <p className="text-center text-3xl text-white"><Typewriter /> seus cards Pokémon favoritos!</p>
                </div>
                <Card className="w-full">
                    <CardHeader className="space-y-1">
                        <CardDescription className="text-center">
                            {activeTab === 'login' ? 'Entre na sua conta' : 'Crie uma nova conta'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">Entrar</TabsTrigger>
                                <TabsTrigger value="register">Registrar</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login">
                                <LoginForm onSubmit={onLoginSubmit} />
                            </TabsContent>
                            <TabsContent value="register">
                                <RegisterForm onSubmit={onRegisterSubmit} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter>
                        <div className="w-full space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Google
                                </Button>
                                <Button variant="outline" onClick={() => setIsGuestDialogOpen(true)}>
                                    <User className="mr-2 h-4 w-4" />
                                    Convidado
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
            <GuestLoginDialog isOpen={isGuestDialogOpen} onClose={() => setIsGuestDialogOpen(false)} />
        </div>
    )
}