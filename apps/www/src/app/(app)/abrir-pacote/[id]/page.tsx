import { TcgCard } from "@/components/tcg-card-view";
import { api } from "@/lib/api";
import { cookies } from "next/headers";

export default async function Page({ params, searchParams }: {
    searchParams: Promise<{
        qtd: string
    }>, params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const { qtd } = await searchParams;
    const body = Array.from({ length: Number(qtd) }, (_, i) => Number(id));
    const token = (await cookies()).get("token")?.value;
    if (!token) {
        return <>Unauthorized</>
    }
    const { data } = await api.post<{ data: Card[] }>("/packages/open-packages", { packagesId: body }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return (
        <div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {data.data.map((card) => (
                    <TcgCard key={card.id} url={card.image_url} />
                ))}
            </ul>
        </div>
    );
}