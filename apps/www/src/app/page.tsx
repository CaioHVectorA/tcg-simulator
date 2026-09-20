import * as React from "react";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { LandingView } from "@/modules/landing/landing-view";

export const metadata: Metadata = {
  title: "Pokémon TCG Simulator | SimTCG",
  keywords:
    "Pokémon, TCG, Simulator, Cards, Trading Card Game, Jogo de Cartas, Coleção, Troca, Batalha, Comunidade, Gratuito",
  description:
    "O SimTCG é uma plataforma web completa onde você pode colecionar, abrir pacotes com sons e animações imersivas e negociar cartas Pokémon de forma gratuita com outros treinadores.",
};

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const isLoggedIn = !!token?.value;

  return <LandingView isLoggedIn={isLoggedIn} />;
}