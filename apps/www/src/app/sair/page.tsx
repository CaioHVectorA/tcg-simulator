'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from '@/lib/cookies'
export default function Sair() {
    const router = useRouter();

    useEffect(() => {
        deleteCookie('token');
        router.push('/entrar');
    }, [router]);

    return null;
}