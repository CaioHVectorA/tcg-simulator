"use client";
import { isAxiosError } from "axios";
import { useRef, useState } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { Swords, Shield, Zap, ArrowLeftRight, Loader2 } from "lucide-react";
import type { ArenaAction, ArenaFighter, ArenaState } from "../../../../shared/arena";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { useTranslation } from "@/i18n/LanguageContext";
import { soundFx } from "@/lib/sound-fx";
import { TcgCardImage } from "@/components/tcg-card-image";

export function BattleArena({state,open,onOpenChange,onUpdate}: {state:ArenaState;open:boolean;onOpenChange:(open:boolean)=>void;onUpdate:(state:ArenaState)=>void}) {
  const {t}=useTranslation(); const {post,get}=useApi(); const reduced=useReducedMotion();
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const pending=useRef<{turn:number;action:ArenaAction;key:string}|null>(null);
  const inFlight=useRef(false);
  const p=state.player[Math.max(0,state.active)]; const n=state.opponent[Math.max(0,state.enemyActive)];
  async function act(action:ArenaAction) {
    if(inFlight.current) return;
    inFlight.current=true;setBusy(true);setError("");soundFx.playCardFlip();
    const request=pending.current || {turn:state.turn,action,key:crypto.randomUUID()}; pending.current=request;
    try {
      const response=await post('/battle/arena/action',{id:state.id,...request});
      const next=response.data.data as ArenaState;pending.current=null;onUpdate(next);
      if(next.status==='won') soundFx.playSuccess();
    } catch (failure) {
      const rejected=isAxiosError(failure) && failure.response?.data?.ok===false;
      if(rejected) pending.current=null;
      setError(rejected ? t(failure.response?.data?.toast || failure.response?.data?.error || 'common.error') : t('arena.networkRetry'));
      // Read authoritative progress after an uncertain response; a retry retains its key.
      try {const res=await get('/battle/arena');const current=res.data.data as ArenaState|null;if(current && current.turn>state.turn){pending.current=null;onUpdate(current);setError("");}}catch{}
    } finally {inFlight.current=false;setBusy(false);}
  }
  function fighter(card:ArenaFighter,enemy:boolean) {
    return <motion.div key={`${enemy}-${enemy?state.enemyActive:state.active}`} animate={reduced?undefined:{scale:[1,1.025,1]}} transition={{duration:.2}} className="min-w-0 rounded-2xl border bg-background/90 p-3 text-center shadow-lg">
      <div className="mx-auto h-36 w-28 overflow-hidden rounded-lg sm:h-48 sm:w-36"><TcgCardImage src={card.image_url} alt={card.name}/></div>
      <p className="mt-2 truncate text-sm font-bold">{card.name}</p><p className="text-xs text-muted-foreground">{card.type} · T{card.rarity}</p>
      <div role="progressbar" aria-label={`${card.name} HP`} aria-valuemin={0} aria-valuemax={card.maxHp} aria-valuenow={card.hp} className="mt-2 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full ${enemy?'bg-rose-500':'bg-emerald-500'} motion-safe:transition-[width] motion-safe:duration-200`} style={{width:`${card.hp/card.maxHp*100}%`}}/></div>
      <p className="mt-1 text-xs tabular-nums">{card.hp} / {card.maxHp} HP</p>
      {!enemy && <><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-amber-400 motion-safe:transition-[width]" style={{width:`${card.energy}%`}}/></div><p className="mt-1 text-xs">{t('arena.energy',{energy:card.energy})}</p></>}
    </motion.div>;
  }
  return <Dialog open={open} onOpenChange={value=>{if(!busy)onOpenChange(value);}}><DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>{t('arena.title')} · {state.npcName}</DialogTitle><DialogDescription>{t('arena.instructions')}</DialogDescription></DialogHeader>
    <div className="flex justify-between gap-2 text-xs font-semibold"><span>{t('arena.turn',{turn:state.turn+1})}</span><span>{t('arena.shields',{count:state.shields})}</span><span>{state.player.filter(f=>f.hp>0).length} : {state.opponent.filter(f=>f.hp>0).length}</span></div>
    <div className="grid grid-cols-2 gap-3">{fighter(p,false)}{fighter(n,true)}</div>
    {state.status==='active' ? <>
      <p className={`rounded-xl border p-3 text-center text-sm font-semibold ${state.intent==='charge'?'border-rose-500 bg-rose-500/10':'bg-muted'}`}>{t(state.intent==='charge'?'arena.incomingCharge':'arena.incomingQuick')}</p>
      <div className="grid grid-cols-3 gap-2 [&_button]:motion-safe:active:scale-95 [&_button]:transition-transform">
        <Button disabled={busy||!!pending.current} onClick={()=>act({kind:'quick'})} className="h-auto min-h-16 flex-col gap-1 whitespace-normal"><Swords className="size-5"/>{t('arena.quick')}<small>+20 ⚡</small></Button>
        <Button disabled={busy||!!pending.current||p.energy<60} onClick={()=>act({kind:'charge'})} className="h-auto min-h-16 flex-col gap-1 whitespace-normal bg-amber-500 text-slate-950 hover:bg-amber-400"><Zap className="size-5"/>{t('arena.charge')}<small>60 ⚡</small></Button>
        <Button variant="outline" disabled={busy||!!pending.current||state.shields===0||state.intent!=='charge'} onClick={()=>act({kind:'shield'})} className="h-auto min-h-16 flex-col gap-1 whitespace-normal"><Shield className="size-5"/>{t('arena.shield')}<small>+15 ⚡</small></Button>
      </div>
      <div className="grid grid-cols-3 gap-2">{state.player.map((card,slot)=><Button key={slot} variant={slot===state.active?'secondary':'outline'} aria-pressed={slot===state.active} disabled={busy||!!pending.current||slot===state.active||card.hp===0||state.turn<state.swapReadyAt} onClick={()=>act({kind:'swap',slot})} className="min-w-0 h-auto min-h-12 px-2"><ArrowLeftRight className="mr-1 size-3 shrink-0"/><span className="truncate">{card.name}<small className="block">{card.hp} HP</small></span></Button>)}</div>
      <Button variant="ghost" disabled={busy||!!pending.current} onClick={()=>act({kind:"forfeit"})}>{t("arena.forfeit")}</Button>
      <p className="text-center text-xs text-muted-foreground">{t('arena.swapHint')}</p>
      {busy && <p role="status" className="flex justify-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/>{t('arena.resolving')}</p>}
      {error && <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">{error}{pending.current && <Button variant="outline" className="mt-2 w-full" disabled={busy} onClick={()=>pending.current&&act(pending.current.action)}>{t('arena.retry')}</Button>}</div>}
    </> : <div className="rounded-xl border bg-muted p-4 text-center"><h3 className="text-xl font-bold">{t(state.status==='won'?'arena.won':'arena.lost')}</h3><p className="mt-2">{t('arena.reward',{coins:state.rewardCoins,xp:state.rewardXp*10})}</p>{state.rewardCoins===0&&<p className="mt-2 text-xs text-muted-foreground">{t('arena.noReward')}</p>}</div>}
    <div aria-live="polite" aria-atomic="true" className="space-y-1 rounded-xl bg-muted p-3 text-sm">{state.log.map((entry,i)=><p key={i}>{t(entry.key,{damage:entry.damage||0,name:entry.name||''})}</p>)}</div>
    <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={busy}>{t(state.status==='active'?'arena.pause':'arena.close')}</Button>
  </DialogContent></Dialog>;
}
