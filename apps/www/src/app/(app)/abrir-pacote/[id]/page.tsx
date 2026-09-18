import { api } from "@/lib/api";
import { cookies } from "next/headers";
import { PackOpenView } from "@/modules/inventory/packages/pack-open-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-syne text-center">
        <h2 className="text-2xl font-bold text-red-400">Sessão expirada ou não autenticado</h2>
        <Button asChild>
          <Link href="/login">Ir para Login</Link>
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
          <h2 className="text-2xl font-bold text-amber-400">Nenhuma carta encontrada</h2>
          <Button asChild>
            <Link href="/inventario">Voltar ao Inventário</Link>
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
        <h2 className="text-2xl font-bold text-red-400">Não foi possível abrir o pacote</h2>
        <p className="text-slate-400 text-sm">
          {error?.response?.data?.toast || error?.message || "Verifique se você possui este pacote em seu inventário."}
        </p>
        <Button asChild>
          <Link href="/inventario">Voltar ao Inventário</Link>
        </Button>
      </div>
    );
  }
}