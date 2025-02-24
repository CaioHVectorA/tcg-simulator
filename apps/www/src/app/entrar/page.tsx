'use client'

import * as React from 'react'
import { SessionProvider, signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
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
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderSimple, LoadingRing } from '@/components/loading-spinner'
import { api } from '@/lib/api'
import { useIsMutating, useMutation } from '@tanstack/react-query'

const loginSchema = z.object({
    email: z.string().email({ message: "Endereço de e-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
})

const registerSchema = z.object({
    username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres" }),
    email: z.string().email({ message: "Endereço de e-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
    referrer: z.string().optional(),
})

const LoginForm = ({ onSubmit, loading }: {
    onSubmit: (values: z.infer<typeof loginSchema>) => void,
    loading: boolean,
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
                <Button type="submit" className="w-full">
                    {loading ? <LoaderSimple /> : "Entrar"}
                </Button>
            </form>
        </Form>
    )
}
const CheckAuth = ({ referrer }: { referrer: string | null }) => {
    const { status, update, data } = useSession();
    const alreadyToast = React.useRef(false);
    const { push } = useRouter()
    const { toast } = useToast();
    // const { }
    useEffect(() => {
        console.log({ status, update, data, alreadyToast: alreadyToast.current });
        if (status === "authenticated" && !alreadyToast.current) {
            toast({
                title: "Conectando a sua conta google...",
                description: "Aguarde um momento",
            });
            alreadyToast.current = true;
            const loginGoogle = async () => {
                console.log({ data })
                const response = await api.post('/auth/google', { name: data.user?.name, email: data.user?.email, image: data.user?.image, referrer });
                if (response.data.ok) {
                    const token = response.data.data.token;
                    setCookie('token', token, 7);
                    push('/home');
                } else {
                    toast({
                        title: "Erro ao conectar a sua conta google",
                        description: "Tente novamente mais tarde",
                    });
                }
            }
            loginGoogle()
        }
    }, [status]);

    return null;
}
const RegisterForm = ({ onSubmit, referrer }: {
    onSubmit: (values: z.infer<typeof registerSchema>) => void,
    referrer?: string
}) => {
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            referrer: referrer ?? "",
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
                <FormField
                    control={form.control}
                    name="referrer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Código de afiliado</FormLabel>
                            <FormControl>
                                <Input disabled={!!referrer} type="text" {...field} />
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

const GuestLoginDialog = ({ isOpen, onClose, onConfirm }: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}) => (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Entrar como Convidado</AlertDialogTitle>
                <AlertDialogDescription>
                    Você está prestes a entrar como convidado. Suas atividades serão limitadas e não serão salvas. Deseja continuar? Nenhum bônus será aplicado!
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
)

export default function LoginRegisterPage() {
    const [activeTab, setActiveTab] = useState('login')
    const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false)
    const { post, loading } = useApi()
    const { toast } = useToast()
    const { push } = useRouter()
    const searchParams = useSearchParams()
    const referrerCode = searchParams.get("referrer")
    const withBonus = !!searchParams.get("with_bonus")
    async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
        const response = await post('/auth/login', values)
        if (response.data.ok) {
            const token = response.data.data.token
            setCookie('token', token, 7)
            push('/home')
        }
    }

    async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
        const response = await post('/auth/register', { ...values, withBonus })
        if (response.data.ok) {
            const token = response.data.data.token
            setCookie('token', token, 7)
            push('/home')
        }
    }
    async function onGuestSubmit() {
        const response = await post('/auth/guest', { referrer: referrerCode })
        if (response.data.ok) {
            const token = response.data.data.token
            setCookie('token', token, 7)
            push('/home')
        }
    }



    return (
        <div className="min-h-screen bg-cover bg-center flex items-center justify-center bg-blend-darken bg-[linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),url(/wallpaper.jpg)]">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-background/80 backdrop-blur-none rounded-lg p-8">
                <div className="flex flex-col font-syne max-md:hidden justify-center items-center bg-primary text-primary-foreground p-8 rounded-lg">
                    {/* <img src="/logo.png" alt="TCG Logo" className="w-64 h-64 mb-4" /> */}
                    <h1 className="text-7xl font-bold mb-2 text-white">SimTCG</h1>
                    <p className="text-center text-3xl text-white"><Typewriter /> seus cards Pokémon favoritos!</p>
                </div>
                <SessionProvider>
                    <CheckAuth referrer={referrerCode} />
                </SessionProvider>
                <Card className="w-full">
                    <CardHeader className="space-y-1">
                        <CardDescription className="text-center">
                            {!withBonus && activeTab === 'login' ? 'Entre na sua conta' : 'Crie uma nova conta'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={withBonus ? 'register' : activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList style={{ display: withBonus ? 'none' : 'grid' }} className="w-full grid-cols-2">
                                <TabsTrigger value="login">Entrar</TabsTrigger>
                                <TabsTrigger value="register">Registrar</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login">
                                <LoginForm loading={loading} onSubmit={onLoginSubmit} />
                            </TabsContent>
                            <TabsContent value="register">
                                <RegisterForm onSubmit={onRegisterSubmit} referrer={referrerCode!} />
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
                                <Button variant="outline" onClick={() => signIn('google')}>
                                    {/* <Mail className="mr-2 h-4 w-4" /> */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className=' h-4 w-4 mr-2' x="0px" y="0px" width="100" height="100" viewBox="0 0 30 30">
                                        <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
                                    </svg>
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
            <GuestLoginDialog onConfirm={onGuestSubmit} isOpen={isGuestDialogOpen} onClose={() => setIsGuestDialogOpen(false)} />
        </div>
    )
}