"use client"
// context/UserContext.tsx
import { useApi } from "@/hooks/use-api";
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

const UserContext = createContext<{ user: User | null; setUser: React.Dispatch<React.SetStateAction<User | null>> } | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const { get, error } = useApi()
    console.log({ error })
    // Exemplo de carregamento inicial
    useEffect(() => {
        get("/user/me").then((response) => {
            setUser(response.data.data);
        }).catch(err => {
            console.log({ err })
        });
    }, []);
    if (!user) return
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    return context?.user as User;
};
