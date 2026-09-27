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

const USER_CACHE_KEY = "tcg_user_cache";

export function getCachedUser(): Partial<User> | null {
    if (typeof window === "undefined") return null;
    try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

export function setCachedUser(user: Partial<User>) {
    if (typeof window === "undefined") return;
    try {
        const prev = getCachedUser() || {};
        const toCache = {
            ...prev,
            id: user.id ?? prev.id,
            username: user.username ?? prev.username,
            picture: user.picture !== undefined ? user.picture : prev.picture,
            money: user.money !== undefined ? user.money : (prev.money ?? 0),
            isGuest: user.isGuest !== undefined ? user.isGuest : prev.isGuest,
        };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(toCache));
    } catch {
        // ignore storage errors
    }
}


const UserContext = createContext<{ user: User | null; isLoading: boolean } | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { get } = useApi()
    const { push } = useRouter()

    // Use cached user data for instant render (prevents NaN/wrong avatar on F5)
    const cachedUser = getCachedUser();

    const { isLoading, data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const response = await get("/user/me")
                if (response.status === 401) {
                    push('/entrar')
                    return null
                }
                const userData = response.data?.data ?? response.data;
                if (userData) setCachedUser(userData);
                return userData;
            } catch (e) {
                return null
            }
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        // Use cached display data as placeholder while fetching
        placeholderData: cachedUser ? (cachedUser as User) : undefined,
    })

    return (
        <UserContext.Provider value={{ user: user || null, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    return (context?.user || {}) as User;
};

export const useUserLoading = () => {
    const context = useContext(UserContext);
    return context?.isLoading ?? false;
};
