'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from '@/lib/cookies'
import { signOut } from 'next-auth/react';
export default function Sair() {

    useEffect(() => {
        async function exit() {
            await signOut()
            deleteCookie('token');
            deleteCookie('next-auth.session-token');
            // router.push('/entrar');
            window.location.href = '/entrar'
        }
        exit();
    }, []);

    return null;
}