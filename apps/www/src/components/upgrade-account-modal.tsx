"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { setCookie } from "@/lib/cookies";
import { Sparkles, ShieldCheck, Users, ArrowRight, Loader2 } from "lucide-react";

interface UpgradeAccountModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentUsername?: string;
}

export function UpgradeAccountModal({
  isOpen,
  onClose,
  open,
  onOpenChange,
  currentUsername = "",
}: UpgradeAccountModalProps) {
  const isModalOpen = open !== undefined ? open : Boolean(isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const { post, loading } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(currentUsername);

  React.useEffect(() => {
    if (currentUsername) setUsername(currentUsername);
  }, [currentUsername]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, informe um endereço de e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve conter ao menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = { email, password };
      if (username.trim()) payload.username = username.trim();

      const res = await post("/auth/upgrade-guest", payload);

      if (res?.data?.ok) {
        if (res.data.data?.token) {
          setCookie("token", res.data.data.token, 7);
        }
        toast({
          title: "🎉 Conta Aprimorada com Sucesso!",
          description: "Você agora é um Treinador registrado. Recursos sociais desbloqueados!",
        });
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        handleClose();
      } else {
        toast({
          title: "Não foi possível aprimorar",
          description: res?.data?.toast || res?.data?.error || "Verifique os dados informados.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro na solicitação",
        description: err?.response?.data?.toast || err?.response?.data?.error || "Falha ao conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-2xl font-syne p-6">
        <DialogHeader className="space-y-2">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
            <Sparkles className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Aprimorar sua Conta de Treinador
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
            Transforme seu acesso em uma conta permanente. Todas as suas cartas, pacotes, moedas e missões serão 100% preservadas!
          </DialogDescription>
        </DialogHeader>

        {/* Vantagens desbloqueadas */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/20 text-xs">
            <Users className="size-4 text-primary shrink-0" />
            <span className="font-semibold text-primary font-sans">Amigos & Chat</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <ShieldCheck className="size-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300 font-sans">Mercado de Trocas</span>
          </div>
        </div>

        <form onSubmit={handleUpgrade} className="space-y-4 pt-2 font-sans">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Nome de Treinador (Nickname):
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome"
              className="rounded-xl h-10 font-syne"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Seu E-mail:
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="treinador@exemplo.com"
              className="rounded-xl h-10 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Criar uma Senha Segura (mín. 6 caracteres):
            </label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl h-10 font-sans"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-syne font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 mt-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="size-4 mr-2" />
            )}
            Salvar e Aprimorar Conta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
