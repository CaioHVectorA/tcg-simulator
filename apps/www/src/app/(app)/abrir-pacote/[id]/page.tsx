import { api } from "@/lib/api";
import { cookies } from "next/headers";
import { PackOpenView } from "@/modules/inventory/packages/pack-open-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { pt } from "@/i18n/locales/pt";
import { en } from "@/i18n/locales/en";
import { es } from "@/i18n/locales/es";
import { jp } from "@/i18n/locales/jp";

const dictionaries = { pt, en, es, jp };

export default async function Page({
  params,
  searchParams,
}: {
  searchParams: Promise<{ qtd?: string }>;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { qtd } = await searchParams;
  const count = Number(qtd) || 1;
  const body = Array.from({ length: count }, () => Number(id));

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const locale = (cookieStore.get("tcg_locale")?.value || "pt") as keyof typeof dictionaries;
  const dict = dictionaries[locale] || dictionaries.pt;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-syne text-center">
        <h2 className="text-2xl font-bold text-red-400">
          {locale === "en" ? "Session expired or not authenticated" : locale === "es" ? "Sesión expirada o no autenticado" : locale === "jp" ? "セッションの有効期限が切れたか、認証されていません" : "Sessão expirada ou não autenticado"}
        </h2>
        <Button asChild>
          <Link href="/login">
            {locale === "en" ? "Go to Login" : locale === "es" ? "Ir al Inicio de Sesión" : locale === "jp" ? "ログインへ" : "Ir para Login"}
          </Link>
        </Button>
      </div>
    );
  }

  try {
    const { data } = await api.post<{ data: Card[] }>(
      "/packages/open-packages",
      { packagesId: body },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const cards = data.data || [];

    if (cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-syne text-center">
          <h2 className="text-2xl font-bold text-amber-400">
            {dict.inventory?.noCardsFound || "No cards found"}
          </h2>
          <Button asChild>
            <Link href="/inventario">
              {dict.inventory?.backToInventory || "Back to Inventory"}
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto py-6">
        <PackOpenView cards={cards} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-syne text-center">
        <h2 className="text-2xl font-bold text-red-400">
          {dict.batchOpening?.errorTitle || "Failed to open packages"}
        </h2>
        <p className="text-slate-400 text-sm">
          {error?.response?.data?.toast || error?.message || dict.batchOpening?.errorDesc}
        </p>
        <Button asChild>
          <Link href="/inventario">
            {dict.inventory?.backToInventory || "Back to Inventory"}
          </Link>
        </Button>
      </div>
    );
  }
}