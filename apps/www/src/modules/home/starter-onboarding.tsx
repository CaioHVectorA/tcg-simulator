'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TcgCardImage } from '@/components/tcg-card-image'
import { useApi } from '@/hooks/use-api'
import { useUiText } from '@/i18n/localized-text'

type Starter = { id: number; name: string; image_url: string; rarity: number; type: string; hp: number }

export function StarterOnboarding() {
  const ui = useUiText()
  const { get, post } = useApi()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const { data } = useQuery<{ completed: boolean; starters: Starter[] }>({
    queryKey: ['onboarding'],
    queryFn: async () => (await get('/onboarding')).data.data,
    staleTime: Infinity,
  })
  const choose = useMutation({
    mutationFn: () => post('/onboarding/starter', { cardId: selected }),
    onSuccess: () => {
      setStep(2)
      queryClient.invalidateQueries({ queryKey: ['/home'] })
    },
  })

  if (!data || (data.completed && step !== 2)) return null
  return (
    <Card className="relative overflow-hidden rounded-3xl border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-card to-purple-500/10 p-5 sm:p-8 shadow-xl">
      <div className="absolute -right-12 -top-12 size-36 rounded-full bg-amber-400/15 blur-3xl" />
      {step === 0 && <div className="relative max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500"><Sparkles className="size-4" /> {ui('Primeira jornada')}</div>
        <h2 className="font-syne text-2xl font-black sm:text-4xl">{ui('Seu primeiro objetivo: montar uma coleção que tenha a sua cara.')}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{ui('Em três passos você escolhe um inicial, abre seus boosters e entra na arena. Cada escolha já conta para sua coleção.')}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-xs font-semibold">
          {[['1', 'Escolha seu inicial'], ['2', 'Abra seu primeiro booster'], ['3', 'Desafie um líder']].map(([n, label]) => <div key={n} className="rounded-2xl border border-border/70 bg-background/50 p-3"><span className="mr-2 text-amber-500">{n}</span>{ui(label)}</div>)}
        </div>
        <Button className="mt-6 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400" onClick={() => setStep(1)}>{ui('Escolher meu inicial')} <ArrowRight className="ml-2 size-4" /></Button>
      </div>}
      {step === 1 && <div className="relative">
        <div className="mb-5"><div className="text-xs font-bold uppercase tracking-widest text-amber-500">{ui('Passo 1 de 3')}</div><h2 className="mt-1 font-syne text-2xl font-black">{ui('Escolha o Pokémon que vai abrir sua jornada')}</h2><p className="mt-2 text-sm text-muted-foreground">{ui('Todos são Tier 4. Escolha pelo estilo, não pela força: você poderá construir seu deck depois.')}</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.starters.map(card => <button key={card.id} type="button" onClick={() => setSelected(card.id)} className={`group rounded-2xl border p-2 text-left transition-all ${selected === card.id ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40' : 'border-border/70 bg-background/40 hover:-translate-y-1 hover:border-amber-400/60'}`}>
            <div className="relative overflow-hidden rounded-xl"><TcgCardImage src={card.image_url} alt={card.name} className="aspect-[2.5/3.5] w-full object-cover" />{selected === card.id && <span className="absolute right-2 top-2 rounded-full bg-amber-400 p-1 text-slate-950"><Check className="size-3" /></span>}</div>
            <span className="mt-2 block truncate text-xs font-bold">{card.name}</span><span className="text-[10px] text-muted-foreground">{card.type} · Tier 4</span>
          </button>)}
        </div>
        <Button disabled={!selected || choose.isPending} className="mt-6 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400" onClick={() => choose.mutate()}>{choose.isPending ? ui('Guardando...') : ui('Ficar com este inicial')} <Check className="ml-2 size-4" /></Button>
      </div>}
      {step === 2 && <div className="relative max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500"><Check className="size-4" /> {ui('Inicial escolhido')}</div><h2 className="font-syne text-2xl font-black sm:text-4xl">{ui('Agora transforme sua escolha em uma coleção.')}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ui('Você já tem uma carta rara para começar. Abra os 5 boosters gratuitos, escolha suas favoritas e monte um deck para a primeira batalha.')}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button asChild className="rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"><a href="/inventario">{ui('Abrir meus boosters')} <ArrowRight className="ml-2 size-4" /></a></Button><Button asChild variant="outline" className="rounded-xl"><a href="/batalha">{ui('Ver primeira batalha')} <ArrowRight className="ml-2 size-4" /></a></Button></div></div>}
    </Card>
  )
}
