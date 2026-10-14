import { translateText } from "@/i18n/text";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Syne } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from "react";
import { MotionPreferences } from "@/components/providers/motion-preferences";
import { Loader } from "@/components/loading-spinner";

const syne = Syne({
  weight: ['400', '600', '700', '800', '500'],
  subsets: ['latin'],
  variable: '--font-syne'
});

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider, type Locale } from "@/i18n/LanguageContext";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const language = (await cookies()).get("tcg_locale")?.value || "pt";
  const locale: Locale = ["pt", "en", "es", "jp"].includes(language) ? language as Locale : "pt";
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  return {
    title: translateText("meta.title", locale), description: translateText("meta.description", locale), metadataBase: base,
    openGraph: { title: "SimTCG", description: translateText("meta.description", locale), type: "website", images: ["/wallpaper.jpg"], locale: {pt:"pt_BR",en:"en_US",es:"es_ES",jp:"ja_JP"}[locale] },
  };
}

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
      <body className={`${syne.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider initialLocale={locale}>
            <MotionPreferences>
            <Suspense fallback={<Loader />}>
              {children}
            </Suspense>
            <Analytics />
            <Toaster />
            </MotionPreferences>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
