'use client'
import { default as NiceAvatar, genConfig } from 'react-nice-avatar'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Box, Layers, RefreshCcw, User, Users, Settings, LogOut, Menu, Coins, Handshake, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from './ui/separator'
import { useUser } from '@/context/UserContext'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { balanceTranslate } from '@/lib/balance-translate'
import { Wip } from './wip'

const menuItems = [
    { name: 'Loja', href: '/loja', icon: Store },
    { name: 'Inventário', href: '/inventario', icon: Box },
    { name: 'Coleção', href: '/colecao', icon: Layers },
    { name: 'Trocas', href: '/trocas', icon: RefreshCcw },
    { name: "Afiliado", href: "/afiliado", icon: Handshake },
    { name: "Missões", href: "/missoes", icon: Trophy }
]

const profileItems = [
    { name: 'Perfil', href: '/perfil', icon: User },
    { name: 'Configurações', href: '/config', icon: Settings },
    { name: 'Sair', href: '/sair', icon: LogOut },
]

export function HeaderMenu() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const { picture, username, money, email } = useUser()
    const config = React.useMemo(() => genConfig(username), [])
    return (
        <header className="sticky font-syne top-0 z-[60] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between pl-4">
                <Link href="/home" className="flex items-center mr-6">
                    <img src="/wallpaper.jpg" alt="TCG Logo" className="w-8 h-8 rounded-full object-cover mr-2" />
                    <span className="font-bold">Pokémon TCG Simulator</span>
                </Link>

                {/* Desktop Navigation */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        {menuItems.map((item) => (
                            <NavigationMenuItem key={item.name}>
                                <Link href={item.href} legacyBehavior passHref>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === item.href}>
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Mobile Navigation */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Esconder Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className=' !z-[9999]'>
                        <SheetHeader className=' flex flex-col items-center'>
                            <SheetTitle className=' sr-only'>Menu</SheetTitle>
                            {/* <Avatar className=' w-3/12 h-full'>
                                <AvatarImage src={picture} className=' object-cover' alt="Sua foto de perfil" />
                                <AvatarFallback>{picture.substring(0, 1)}</AvatarFallback>
                            </Avatar> */}
                            <NiceAvatar className=' w-3/12 h-full' {...config} />
                            <h3 className=' text-2xl font-syne'>{username}</h3>
                            <div className=' flex gap-1 items-center'>
                                <p className='text-xl font-syne'>{balanceTranslate(money)}</p>
                                <Coins color='gold' className="size-4" />
                            </div>
                            <Separator />
                        </SheetHeader>
                        <nav className="flex flex-col space-y-4 mt-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center py-2 px-4 rounded-md hover:bg-accent",
                                        pathname === item.href && "bg-accent"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                            <Link href="/friends" className="flex items-center py-2 px-4 rounded-md hover:bg-accent">
                                <Users className="w-4 h-4 mr-2" />
                                Social
                            </Link>
                            <Separator />
                            {profileItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center py-2 px-4 rounded-md hover:bg-accent",
                                        pathname === item.href && "bg-accent"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>

                <div className="ml-auto flex max-md:hidden items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative size-10 p-0 bg-transparent rounded-full">
                                {/* <Avatar className=' h-wull h-full'>
                                    <AvatarImage className=' object-cover' src={picture} alt="Sua foto de perfil" />
                                    <AvatarFallback>{username.substring(0, 1)}</AvatarFallback>
                                </Avatar> */
                                    <NiceAvatar className='h-full aspect-square' {...config} />
                                }
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-52" align="center" forceMount>
                            <>
                                <p className=' font-syne text-xl my-1 text-center'>{username}</p>
                                <Separator className=' mb-2' />
                                {profileItems.map((item, index) => (
                                    <React.Fragment key={item.name}>
                                        <DropdownMenuItem asChild>
                                            <Link href={item.href}>
                                                <item.icon className="mr-2 h-4 w-4" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {index === profileItems.length - 2 && <DropdownMenuSeparator />}
                                    </React.Fragment>
                                ))}
                            </>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className=' flex gap-2 items-center'>
                        <p className='text-xl'>{balanceTranslate(money)}</p>
                        <Coins color='gold' className="size-6" />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Users className=' size-6' />
                            </SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>Social</SheetTitle>
                                </SheetHeader>
                                {/* Conteúdo de amizade aqui */}
                                <Wip />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}