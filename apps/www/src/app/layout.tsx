import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Syne } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from "react";
import { Loader } from "@/components/loading-spinner";

const syne = Syne({
  weight: ['400', '600', '700', '800', '500'],
  subsets: ['latin'],
  variable: '--font-syne'
});

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider, type Locale } from "@/i18n/LanguageContext";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Pokémon TCG Simulator | Colecione, Batalhe e Negocie",
  description: "O mais completo simulador online de Pokémon TCG. Colecione cartas raras, desafie Líderes de Ginásio na arena tática e participe do mercado de trocas.",
  metadataBase: new URL("https://tcg-simulator.com"),
  alternates: {
    canonical: "/",
    languages: {
      "pt": "https://tcg-simulator.com/?lang=pt",
      "en": "https://tcg-simulator.com/?lang=en",
      "es": "https://tcg-simulator.com/?lang=es",
      "ja": "https://tcg-simulator.com/?lang=jp",
      "x-default": "https://tcg-simulator.com/",
    },
  },
  openGraph: {
    title: "Pokémon TCG Simulator",
    description: "Simulador de Pokémon Trading Card Game com batalhas táticas de 3 rotas, boosters lendários e mercado de trocas.",
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES", "ja_JP"],
  },
};

const langCodeMap: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  jp: "ja-JP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("tcg_locale")?.value;
  const locale: Locale =
    rawLocale === "en" || rawLocale === "es" || rawLocale === "jp" || rawLocale === "pt"
      ? rawLocale
      : "pt";

  return (
    <html lang={langCodeMap[locale] || "pt-BR"} suppressHydrationWarning>
      <head>
        {/* Google SEO Alternate hreflang tags */}
        <link rel="alternate" hrefLang="pt" href="https://tcg-simulator.com/?lang=pt" />
        <link rel="alternate" hrefLang="en" href="https://tcg-simulator.com/?lang=en" />
        <link rel="alternate" hrefLang="es" href="https://tcg-simulator.com/?lang=es" />
        <link rel="alternate" hrefLang="ja" href="https://tcg-simulator.com/?lang=jp" />
        <link rel="alternate" hrefLang="x-default" href="https://tcg-simulator.com/" />
      </head>
      <body className={`${syne.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider initialLocale={locale}>
            <Suspense fallback={<Loader />}>
              {children}
            </Suspense>
            <Analytics />
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
