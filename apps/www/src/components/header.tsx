'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Box, Layers, RefreshCcw, User, Users, Settings, LogOut, Menu, Coins } from 'lucide-react'
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

const menuItems = [
    { name: 'Loja', href: '/store', icon: Store },
    { name: 'Inventário', href: '/inventory', icon: Box },
    { name: 'Coleção', href: '/collection', icon: Layers },
    { name: 'Trocas', href: '/trades', icon: RefreshCcw },
]

const profileItems = [
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Social', href: '/social', icon: Users },
    { name: 'Configurações', href: '/settings', icon: Settings },
    { name: 'Sair', href: '/signout', icon: LogOut },
]

export function HeaderMenu() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const { picture, username, money } = useUser()
    return (
        <header className="sticky font-syne top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between pl-4">
                <Link href="/" className="flex items-center mr-6">
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
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Menu</SheetTitle>
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
                                <img
                                    src="/wallpaper.jpg"
                                    alt="User Avatar"
                                    className="h-full w-full rounded-full object-cover"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40" align="end" forceMount>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className=' flex gap-2 items-center'>
                        <p className='text-xl'>{money}</p>
                        <Coins color='gold' className="size-6" />
                    </div>
                </div>
            </div>
        </header>
    )
}