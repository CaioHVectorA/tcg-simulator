'use client'

import * as React from 'react'
import { SessionProvider, signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Mail, User, Sparkles, Dices, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Typewriter } from '@/modules/auth/typewriter'
import { useApi } from '@/hooks/use-api'
import { useToast } from '@/hooks/use-toast'
import { setCookie } from '@/lib/cookies'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderSimple } from '@/components/loading-spinner'
import { api } from '@/lib/api'
import { soundFx } from '@/lib/sound-fx'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const loginSchema = z.object({
    username: z.string().min(2, { message: "Informe seu nome de usuário ou e-mail" }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
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
            username: "",
            password: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 font-sans">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Nome de Treinador ou E-mail</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: AshKetchum ou treinador@exemplo.com" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Senha Secreta</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading} className="w-full h-11 font-syne font-bold bg-primary text-primary-foreground shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all">
                    {loading ? <LoaderSimple /> : "Entrar na Minha Conta"}
                </Button>
            </form>
        </Form>
    )
}

const CheckAuth = ({ referrer }: { referrer: string | null }) => {
    const { status, data } = useSession();
    const alreadyToast = React.useRef(false);
    const { push } = useRouter()
    const { toast } = useToast();

    useEffect(() => {
        if (status === "authenticated" && !alreadyToast.current) {
            toast({
                title: "Conectando conta Google...",
                description: "Preparando seus dados de treinador",
            });
            alreadyToast.current = true;
            const loginGoogle = async () => {
                const response = await api.post('/auth/google', {
                    name: data?.user?.name,
                    email: data?.user?.email,
                    image: data?.user?.image,
                    referrer
                });
                if (response.data.ok) {
                    const token = response.data.data.token;
                    setCookie('token', token, 7);
                    push('/home');
                } else {
                    toast({
                        title: "Erro ao conectar conta Google",
                        description: "Tente novamente mais tarde",
                        variant: "destructive"
                    });
                }
            }
            loginGoogle()
        }
    }, [status]);

    return null;
}

const RegisterForm = ({ onSubmit, referrer, loading }: {
    onSubmit: (values: z.infer<typeof registerSchema>) => void,
    referrer?: string,
    loading: boolean,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 font-sans">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Nome de Treinador</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: AshKetchum151" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Email</FormLabel>
                            <FormControl>
                                <Input placeholder="treinador@exemplo.com" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Senha (mínimo 8 caracteres)</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="referrer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground/90">Código de Indicação (Opcional)</FormLabel>
                            <FormControl>
                                <Input disabled={!!referrer} type="text" placeholder="Código de amigo" className="h-10 text-sm font-sans" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading} className="w-full h-11 font-syne font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md">
                    {loading ? <LoaderSimple /> : "Criar Minha Conta"}
                </Button>
            </form>
        </Form>
    )
}

const guestRandomNames = [
    "TreinadorRed", "MestreCharizard", "PikachuFan", "GengarMaster",
    "LucarioAce", "MewtwoChamp", "EeveeCollector", "DragoniteHero",
    "BlastoisePro", "SnorlaxKing", "AlakazamMind", "GarchompApex"
];

const GuestForm = ({ onSubmit, loading }: {
    onSubmit: (values: { nickname: string }) => void,
    loading: boolean,
}) => {
    const [nickname, setNickname] = React.useState("")
    const [diceSpin, setDiceSpin] = React.useState(0)

    const generateRandomNick = () => {
        soundFx.playCardFlip();
        setDiceSpin((prev) => prev + 360);
        const base = guestRandomNames[Math.floor(Math.random() * guestRandomNames.length)];
        const num = Math.floor(Math.random() * 900 + 100);
        setNickname(`${base}_${num}`);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        soundFx.playSuccess();
        const chosen = nickname.trim() || `Treinador_${Math.floor(Math.random() * 9000 + 1000)}`;
        onSubmit({ nickname: chosen });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {/* Campo de Nickname com Botão Tátil de Dados */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/90 block">
                    Apelido de Treinador
                </label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Ex: TreinadorRed_151" 
                        value={nickname} 
                        onChange={(e) => setNickname(e.target.value)} 
                        className="h-10 text-sm font-sans"
                        maxLength={24}
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateRandomNick} 
                        title="Sortear apelido lendário"
                        className="h-10 px-3 shrink-0 hover:bg-amber-500/10 hover:border-amber-500/40"
                    >
                        <motion.div animate={{ rotate: diceSpin }} transition={{ duration: 0.4 }}>
                            <Dices className="size-4 text-amber-500" />
                        </motion.div>
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Clique no dado para sortear um nome épico ou digite seu preferido.
                </p>
            </div>

            {/* Banner Informativo com Contraste Apropriado */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed shadow-xs">
                <div className="flex items-start gap-2">
                    <Sparkles className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <strong className="font-semibold block mb-0.5 text-amber-950 dark:text-amber-100">
                            Acesso Instantâneo Sem Cadastro:
                        </strong>
                        Abra pacotes, colecione cartas e ganhe moedas na hora! Seu progresso é salvo no dispositivo e você pode transformá-lo em uma conta definitiva a qualquer momento sem perder nada.
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 font-syne font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
                {loading ? <LoaderSimple /> : "Começar a Jogar Imediatamente"}
            </Button>
        </form>
    )
}

export default function LoginRegisterPage() {
    const [activeTab, setActiveTab] = useState('login')
    const { post, loading } = useApi()
    const { toast } = useToast()
    const { push } = useRouter()
    const searchParams = useSearchParams()
    const referrerCode = searchParams.get("referrer")
    const withBonus = !!searchParams.get("with_bonus")

    async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
        try {
            const response = await post('/auth/login', values)
            if (response?.data?.ok) {
                const token = response.data.data.token
                setCookie('token', token, 7)
                soundFx.playSuccess()
                push('/home')
            } else if (response?.data?.toast || response?.data?.error) {
                toast({
                    title: "Erro ao entrar",
                    description: response.data.toast || response.data.error,
                    variant: "destructive"
                })
            }
        } catch (err: any) {
            toast({
                title: "Falha na conexão",
                description: err?.response?.data?.error || err?.response?.data?.toast || "Não foi possível conectar ao servidor.",
                variant: "destructive"
            })
        }
    }

    async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
        try {
            const response = await post('/auth/register', { ...values, withBonus })
            if (response?.data?.ok) {
                const token = response.data.data.token
                setCookie('token', token, 7)
                soundFx.playLegendaryFanfare()
                push('/home')
            } else if (response?.data?.toast || response?.data?.error) {
                toast({
                    title: "Erro no cadastro",
                    description: response.data.toast || response.data.error,
                    variant: "destructive"
                })
            }
        } catch (err: any) {
            toast({
                title: "Falha na conexão",
                description: err?.response?.data?.error || err?.response?.data?.toast || "Não foi possível conectar ao servidor.",
                variant: "destructive"
            })
        }
    }

    async function onGuestSubmit(data?: { nickname: string }) {
        try {
            const response = await post('/auth/guest', {
                referrer: referrerCode,
                nickname: data?.nickname
            })
            if (response?.data?.ok) {
                const token = response.data.data.token
                setCookie('token', token, 7)
                soundFx.playSuccess()
                push('/home')
            } else if (response?.data?.toast || response?.data?.error) {
                toast({
                    title: "Erro ao entrar como convidado",
                    description: response.data.toast || response.data.error,
                    variant: "destructive"
                })
            }
        } catch (err: any) {
            toast({
                title: "Falha na conexão",
                description: err?.response?.data?.error || err?.response?.data?.toast || "Não foi possível conectar ao servidor.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Fundo com gradiente sutil e partículas de iluminação */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center z-10">
                {/* Coluna Visual do Branding (Desktop) */}
                <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 border border-border/80 backdrop-blur-xl shadow-2xl h-[520px]">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-6">
                            <Sparkles className="size-3.5 text-amber-400" />
                            <span>Simulador Oficial Pokémon</span>
                        </div>

                        <h1 className="font-syne text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight mb-3">
                            SimTCG
                        </h1>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                            O simulador completo onde você abre boosters, coleciona cartas ultra raras e negocia com outros treinadores.
                        </p>
                    </div>

                    {/* Badge Animado de Vantagens */}
                    <div className="space-y-3 bg-muted/40 border border-border/40 p-4 rounded-2xl font-sans text-xs">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Abertura cinematográfica com áudio</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Trocas P2P ativas na comunidade</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Missões diárias com recompensas</span>
                        </div>
                    </div>

                    <Link href="/" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                        ← Voltar para a página inicial
                    </Link>
                </div>

                {/* Coluna do Formulário de Acesso */}
                <div className="md:col-span-7">
                    <SessionProvider>
                        <CheckAuth referrer={referrerCode} />
                    </SessionProvider>

                    <Card className="border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-syne text-2xl font-bold text-foreground">
                                        {withBonus ? 'Resgatar Bônus de 3.000 Moedas' : activeTab === 'login' ? 'Acessar Simulador' : activeTab === 'register' ? 'Criar Conta de Treinador' : 'Acesso Convidado'}
                                    </CardTitle>
                                    <CardDescription className="font-sans text-xs text-muted-foreground mt-1">
                                        {activeTab === 'login' ? 'Digite suas credenciais para continuar sua jornada' : activeTab === 'register' ? 'Cadastre-se para desbloquear todas as funções sociais' : 'Jogue agora mesmo sem necessidade de senha'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 pt-0">
                            <Tabs value={withBonus ? 'register' : activeTab} onValueChange={(val) => {
                                setActiveTab(val);
                                soundFx.playCardFlip();
                            }} className="w-full">
                                <TabsList style={{ display: withBonus ? 'none' : 'grid' }} className="w-full grid-cols-3 bg-muted/60 p-1 rounded-xl mb-5">
                                    <TabsTrigger value="login" className="rounded-lg text-xs font-semibold font-sans">
                                        Entrar
                                    </TabsTrigger>
                                    <TabsTrigger value="register" className="rounded-lg text-xs font-semibold font-sans">
                                        Registrar
                                    </TabsTrigger>
                                    <TabsTrigger value="guest" className="rounded-lg text-xs font-semibold font-sans">
                                        ⚡ Convidado
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="login">
                                    <LoginForm loading={loading} onSubmit={onLoginSubmit} />
                                </TabsContent>
                                <TabsContent value="register">
                                    <RegisterForm loading={loading} onSubmit={onRegisterSubmit} referrer={referrerCode!} />
                                </TabsContent>
                                <TabsContent value="guest">
                                    <GuestForm loading={loading} onSubmit={onGuestSubmit} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>

                        <CardFooter className="p-6 pt-0 flex flex-col gap-4 border-t border-border/40 mt-2">
                            <div className="w-full relative mt-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/60" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-sans tracking-wider">
                                    <span className="bg-card px-2 text-muted-foreground">Ou conecte-se com</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    onClick={() => signIn('google')} 
                                    className="font-sans text-xs h-10 border-border hover:bg-secondary/60"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className='size-4 mr-2' viewBox="0 0 30 30">
                                        <path fill="currentColor" d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z" />
                                    </svg>
                                    Google
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setActiveTab('guest')} 
                                    className="font-sans text-xs h-10 border-border hover:bg-secondary/60"
                                >
                                    <User className="size-4 mr-2 text-amber-500" />
                                    Modo Convidado
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}