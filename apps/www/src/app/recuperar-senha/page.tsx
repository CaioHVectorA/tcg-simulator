"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/i18n/LanguageContext";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderSimple } from "@/components/loading-spinner";
export default function RecoverAccount() {
  const { t } = useTranslation();const { post, loading } = useApi();
  const token=useSearchParams().get('token');const [message,setMessage]=useState('');const [finished,setFinished]=useState(false);
  return <main className="mx-auto max-w-md px-5 py-16 space-y-5">
    <h1 className="text-2xl font-bold">{t('auth.resetTitle')}</h1>
    {message && <p role="status">{message}</p>}
    {!finished && <form className="space-y-4" onSubmit={async(event)=>{
      event.preventDefault(); if(loading)return;
      const data=new FormData(event.currentTarget);
      try {
        const result=await post(token?'/auth/password/reset':'/auth/password/forgot', token?{token,password:data.get('password')}:{email:data.get('email')});
        setMessage(t(result.data.toast || result.data.error || 'common.error'));
        setFinished(Boolean(result.data.ok));
      }catch {setMessage(t('common.networkError'));}
    }}>
      <label className="block space-y-2"><span>{t(token?'auth.newPassword':'Email')}</span>
        <Input name={token?'password':'email'} type={token?'password':'email'} required minLength={token?8:undefined} maxLength={token?128:254} autoComplete={token?'new-password':'email'} />
      </label>
      <Button type="submit" disabled={loading}>{loading?<LoaderSimple/>:t(token?'auth.savePassword':'auth.sendReset')}</Button>
    </form>}
    <Link href="/entrar" className="block underline">{t('Entrar')}</Link>
  </main>;
}
