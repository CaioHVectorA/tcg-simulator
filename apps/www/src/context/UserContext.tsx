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
    picture: string;
    isGuest?: boolean;
    authProvider?: string;
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
            try {
                const response = await get("/user/me")
                if (response.status === 401) {
                    push('/entrar')
                    return null
                }
                return response.data?.data ?? response.data
            } catch (e) {
                return null
            }
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    })

    return (
        <UserContext.Provider value={{ user: user || null }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    return (context?.user || {}) as User;
};
