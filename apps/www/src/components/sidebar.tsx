"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { default as NiceAvatar, genConfig } from "react-nice-avatar"
import {
    Store,
    Box,
    Layers,
    RefreshCcw,
    User,
    Users,
    Settings,
    LogOut,
    Coins,
    Handshake,
    Trophy,
    ChevronDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUser } from "@/context/UserContext"
import { balanceTranslate } from "@/lib/balance-translate"
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar"

const menuItems = [
    { name: "Loja", href: "/loja", icon: Store },
    { name: "Inventário", href: "/inventario", icon: Box },
    { name: "Coleção", href: "/colecao", icon: Layers },
    { name: "Trocas", href: "/trocas", icon: RefreshCcw },
    { name: "Afiliado", href: "/afiliado", icon: Handshake },
    { name: "Missões", href: "/missoes", icon: Trophy },
]

const rankingItems = [
    { name: "Raridade", href: "/ranking/raridade" },
    { name: "Magnatas", href: "/ranking/magnatas" },
]

export function SideMenu() {
    const pathname = usePathname()
    const { picture, username, money, email } = useUser()
    const config = React.useMemo(() => genConfig(username), [username])

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Link href="/home" className="flex items-center px-4 py-2">
                        <img src="/wallpaper.jpg" alt="TCG Logo" className="w-8 h-8 rounded-full object-cover mr-2" />
                        <span className="font-bold text-lg">Pokémon TCG</span>
                    </Link>
                    <div className="flex flex-col items-center p-4">
                        <NiceAvatar className="w-20 h-20 mb-2" {...config} />
                        <h3 className="text-lg font-semibold">{username}</h3>
                        <div className="flex items-center mt-1">
                            <p className="text-sm mr-1">{balanceTranslate(money)}</p>
                            <Coins color="gold" className="w-4 h-4" />
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu >
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton asChild isActive={pathname === item.href}>
                                    <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton>
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>Social</span>
                                        <ChevronDown className="ml-auto h-4 w-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right">
                                    <DropdownMenuItem asChild>
                                        <Link href="/friends">Amigos</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/messages">Mensagens</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton>
                                        <Trophy className="mr-2 h-4 w-4" />
                                        <span>Ranking</span>
                                        <ChevronDown className="ml-auto h-4 w-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right">
                                    {rankingItems.map((item) => (
                                        <DropdownMenuItem key={item.name} asChild>
                                            <Link href={item.href}>{item.name}</Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/perfil">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/config">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurações</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/sair">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    )
}

