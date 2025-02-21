import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from "react";
import { Loader } from "@/components/loading-spinner";
import { SessionProvider } from "next-auth/react";
const syne = Syne({
  weight: ['400', '600', '700', '800', '500'],
  subsets: ['latin'],
  variable: '--font-syne'
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script> */}
      </head>
      <body
        className={`${syne.variable} antialiased`}
      >
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
