import * as React from "react";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { LandingView } from "@/modules/landing/landing-view";

export async function generateMetadata(): Promise<Metadata> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { alternates: { canonical: "/", languages: Object.fromEntries([["pt","pt"],["en","en"],["es","es"],["ja","jp"],["x-default","pt"]].map(([language, code]) => [language, `${site}/?lang=${code}`])) } };
}

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const isLoggedIn = !!token?.value;

  return <LandingView isLoggedIn={isLoggedIn} />;
}
