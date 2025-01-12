"use client"
import { LoadingRing } from "@/components/loading-spinner";
// context/UserContext.tsx
import { useApi } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
    username: string;
    email: string;
    id: string,
    password: string,
    createdAt: string,
    updatedAt: string,
    money: number,
    last_daily_bounty: string,
    last_entry: string,
    picture: string
    // Outras propriedades que você precisar
};

const UserContext = createContext<{ user: User | null } | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    // const [user, setUser] = useState<User | null>(null);
    const { get, error } = useApi()
    // Exemplo de carregamento inicial
    // useEffect(() => {
    //     get("/user/me").then((response) => {
    //         setUser(response.data.data);
    //     }).catch(err => {
    //         console.log({ err })
    //     });
    // }, []);
    const { push } = useRouter()
    const { isLoading, data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await get("/user/me")
            if (response.status === 401) {
                await new Promise(resolve => setTimeout(resolve, 3000))
                const newResponse = await get("/user/me")
                if (newResponse.status === 401) {
                    return push('/entrar')
                }
                return newResponse.data.data
            }
            return response.data.data
        },
    })
    // if (!user) return console.log('User not found')
    if (isLoading) return (
        <UserContext.Provider value={{ user: null }}>
            <div className=" w-full flex flex-col items-center h-full justify-center">
                <LoadingRing />
                <h3 className="text-black font-syne">Carregando suas informações</h3>
                <p className=" font-syne">Caso demore muito, considere atualizar.</p>
            </div>
        </UserContext.Provider>
    )
    return (
        <UserContext.Provider value={{ user: user || null }}>
            {children}
        </UserContext.Provider >
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    return context?.user as User;
};
