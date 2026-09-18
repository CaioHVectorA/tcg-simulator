"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loadTcgImg } from "@/lib/load-tcg-img";
import {
  Sparkles,
  Image as ImageIcon,
  Layers,
  Link2,
  Check,
  Loader2,
  User,
} from "lucide-react";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPicture?: string;
  username: string;
}

const PRESET_AVATARS = [
  {
    name: "Pikachu",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
  },
  {
    name: "Charizard",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
  },
  {
    name: "Gengar",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
  },
  {
    name: "Mewtwo",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
  },
  {
    name: "Eevee",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
  },
  {
    name: "Lucario",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
  },
  {
    name: "Umbreon",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png",
  },
  {
    name: "Rayquaza",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png",
  },
  {
    name: "Blastoise",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
  },
  {
    name: "Venusaur",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
  },
  {
    name: "Mimikyu",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png",
  },
  {
    name: "Lugia",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png",
  },
  {
    name: "Greninja",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png",
  },
  {
    name: "Snorlax",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
  },
  {
    name: "Gardevoir",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png",
  },
  {
    name: "Tyranitar",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png",
  },
];

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentPicture = "",
  username,
}: AvatarPickerModalProps) {
  const { get, patch } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentPicture);
  const [customUrl, setCustomUrl] = useState<string>("");

  // Busca cartas do usuário para usar como avatar
  const { data: userCards = [], isLoading: loadingCards } = useQuery<any[]>({
    queryKey: ["user-cards-for-avatar"],
    queryFn: async () => {
      const res = await get("/cards?page=1&limit=48");
      const list = res.data?.data?.cards || res.data?.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: isOpen,
  });

  const { mutate: saveAvatar, isPending: saving } = useMutation({
    mutationFn: async (picUrl: string) => {
      const res = await patch("/user/profile", { picture: picUrl });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi alterada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar avatar",
        description: err.response?.data?.toast || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (url: string) => {
    setSelectedAvatar(url);
  };

  const handleCustomUrlApply = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 rounded-3xl overflow-hidden font-syne">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" />
            Escolha seu Avatar
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Selecione um Pokémon lendário, use a arte de uma de suas cartas da coleção ou insira uma URL personalizada.
          </DialogDescription>
        </DialogHeader>

        {/* Live Preview Bar */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/40 border border-border/80 mb-2 shrink-0">
          <div className="relative">
            <Avatar username={username} src={selectedAvatar} className="size-16 ring-4 ring-primary/20 shadow-md" />
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-white">
              <Check className="size-3" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground truncate">{username}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                Pré-visualização
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5 font-sans">
              {selectedAvatar ? "Avatar selecionado pronto para salvar" : "Nenhum avatar customizado"}
            </p>
          </div>
          <Button
            onClick={() => saveAvatar(selectedAvatar)}
            disabled={saving || !selectedAvatar}
            className="rounded-xl h-10 px-4 bg-primary text-primary-foreground font-bold text-xs shrink-0"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Check className="size-4 mr-1.5" />
            )}
            Salvar Avatar
          </Button>
        </div>

        {/* Tabs de Seleção */}
        <Tabs defaultValue="gallery" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 h-10 rounded-xl bg-accent/60 p-1 mb-3 shrink-0">
            <TabsTrigger value="gallery" className="rounded-lg text-xs gap-1.5 font-semibold">
              <ImageIcon className="size-3.5" /> Galeria
            </TabsTrigger>
            <TabsTrigger value="cards" className="rounded-lg text-xs gap-1.5 font-semibold">
              <Layers className="size-3.5" /> Minhas Cartas
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg text-xs gap-1.5 font-semibold">
              <Link2 className="size-3.5" /> Link / URL
            </TabsTrigger>
          </TabsList>

          {/* 1. Galeria Pokémon */}
          <TabsContent value="gallery" className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 p-1">
              {PRESET_AVATARS.map((p) => {
                const isSelected = selectedAvatar === p.url;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelect(p.url)}
                    className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <div className="size-16 sm:size-20 flex items-center justify-center relative">
                      <img
                        src={p.url}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-foreground mt-2 truncate w-full text-center">
                      {p.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* 2. Minhas Cartas */}
          <TabsContent value="cards" className="flex-1 overflow-y-auto pr-1">
            {loadingCards ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-sans">Carregando suas cartas...</p>
              </div>
            ) : userCards.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-sans">
                <Layers className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold font-syne text-foreground">Nenhuma carta encontrada</p>
                <p className="text-xs mt-1">Abra booster packs na loja ou inventário para obter cartas!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-1">
                {userCards.map((item: any) => {
                  const card = item.card || item;
                  const cardImg = card.image_url ? loadTcgImg(card.image_url) : "";
                  const isSelected = selectedAvatar === cardImg;

                  return (
                    <button
                      key={card.id || item.id}
                      type="button"
                      onClick={() => handleSelect(cardImg)}
                      className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                          : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    >
                      <div className="w-full aspect-[2.5/3.5] rounded-lg overflow-hidden relative shadow-xs">
                        <img
                          src={cardImg}
                          alt={card.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5 truncate w-full text-center">
                        {card.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                          <Check className="size-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* 3. Link Customizado */}
          <TabsContent value="custom" className="flex-1 p-2 space-y-4 font-sans text-xs">
            <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
              <label className="font-semibold text-foreground block">
                Insira a URL direta da imagem (PNG, WebP, JPG):
              </label>
              <div className="flex gap-2">
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://i.imgur.com/exemplo.png"
                  className="rounded-xl h-10 font-mono text-xs"
                />
                <Button
                  onClick={handleCustomUrlApply}
                  disabled={!customUrl.trim()}
                  className="h-10 px-4 rounded-xl font-syne font-bold shrink-0"
                >
                  Testar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dica: Certifique-se de que a imagem tenha proporções quadradas para melhor visualização no perfil.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
