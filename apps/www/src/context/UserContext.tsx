"use client"
import { LoadingRing } from "@/components/loading-spinner";
// context/UserContext.tsx
import { useApi } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
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
    const { isLoading, data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await get("/user/me")
            return response.data.data
        },
    })
    // if (!user) return console.log('User not found')
    if (isLoading) return (
        <UserContext.Provider value={{ user: null }}>
            {/* {children} */}
            <LoadingRing />
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
