"use client"

import { LoadingRing } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import ReactNiceAvatar, { genConfig } from "react-nice-avatar"
type Referral = {
    hash: string;
    referrals: {
        id: number;
        referredId: number;
        referrerProtocolId: number;
        userId: number;
        username: string;
        email: string;
        referredDate: string;
        referredRarity: number;
        redeemed: boolean;
    }[];
}

function TableReferral({ referrals }: { referrals: Referral['referrals'] }) {
    const { post } = useApi()
    const qClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: async (referredId: number) => {
            const response = await post('/referral/redeem', { referredId })
            await qClient.invalidateQueries({ queryKey: ["referral", "my-referrals"] })
            await qClient.invalidateQueries({ queryKey: ["user"] })
            await qClient.refetchQueries({ queryKey: ["referral", "my-referrals"] })
            await qClient.refetchQueries({ queryKey: ["user"] })
            return response.data.data
        },
        mutationKey: ["referral", "redeem"]
    })
    return (
        <div className="h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 snap-y snap-mandatory">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 snap-start">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pontos de Raridade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 h-40">
                    {referrals.map((referral, index) => (
                        <tr className=" snap-start" key={index}>
                            {/* <td className="px-6 py-4 whitespace-nowrap"> */}
                            <td className="px-6 py-4 gap-2 flex items-center whitespace-nowrap">
                                <ReactNiceAvatar className='h-12 w-12' {...genConfig(referral.username)} />
                                {/* </td> */}
                                <div className="text-lg font-syne font-medium text-gray-900">{referral.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 font-syne">{referral.referredRarity} Pontos</div>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{new Date(referral.referredDate).toLocaleDateString()}</div>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Button onClick={() => mutate(referral.id)} disabled={referral.redeemed} className="rounded-full font-syne text-sm" size={'sm'}>
                                    {referral.redeemed ? 'Resgatado' : 'Resgatar'}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
export default function Affiliate() {
    const { get, post } = useApi()
    const qClient = useQueryClient()
    const { data, isLoading } = useQuery<Referral>({
        queryKey: ["referral", "my-referrals"],
        queryFn: async () => {
            const response = await get('/referral/my-referrals')
            return response.data.data
        }
    })
    const { mutate } = useMutation({
        mutationFn: async () => {
            const response = await post('/referral/create-referral', {})
            await qClient.invalidateQueries({ queryKey: ["referral", "my-referrals"] })
            await qClient.refetchQueries({ queryKey: ["referral", "my-referrals"] })
            return response.data.data
        },
        mutationKey: ["referral", "create-referral"]
    })
    const { toast } = useToast()
    const handleCopy = async () => {
        if (!data) return
        const text = `Venha colecionar cartas comigo! \n ${window.location.origin}/entrar?with_bonus=true&referrer=${data.hash}`
        await navigator.clipboard.writeText(text)
        toast({ title: 'Link copiado!', description: 'Agora você pode compartilhar seu link com seus amigos e nas suas redes!' })
    }
    return (
        <main className=" grid grid-cols-2 gap-4 px-[5%]">
            <div>
                {!data ? (
                    <div className=" mt-6 flex flex-col items-center">
                        <h2 className=" font-syne text-4xl text-right">
                            Convide seus amigos, ganhe moedas!
                        </h2>
                        <h3 className=" font-syne text-3xl text-center">Comece agora!</h3>
                        <p className="font-syne text-xl text-center mt-2">Está gostando da experiência? Por que não chama seus amigos para colecionar cartas com você?</p>
                        <Button onClick={() => mutate()} className=" mt-12 rounded-full font-syne text-xl" size={'lg'}>Criar link de afiliado</Button>
                    </div>
                ) : (
                    <div>
                        <h3 className=" font-syne mt-8 text-3xl text-center">Seu link de afiliado</h3>
                        <p className=" font-syne text-xl text-center mt-2">Compartilhe este link com seus amigos e comece a ganhar moedas!</p>
                        <div className=" mt-12 flex">
                            <input type="text" disabled value={`${window.location.origin}/entrar?with_bonus=true&referrer=${data.hash}`} className=" w-full text-black/50 p-2 border rounded-l-full" />
                            <Button onClick={handleCopy} className="rounded-r-full font-syne text-xl" size={'lg'}>Copiar</Button>
                        </div>
                        <img src="/afiliate.png" alt="Dois amigos apertando suas mãos" className="w-64 mx-auto mt-4 object-cover" />
                    </div>
                )}
            </div>
            {/* <section className=" pt-8 pb-20 flex flex-col items-center justify-center relative"> */}
            {isLoading ? (
                <>
                    <LoadingRing />
                </>
            ) : (
                <>
                    {!data ? (
                        <img src="/afiliate.png" alt="Dois amigos apertando suas mãos" className="w-full mx-auto mt-4 object-cover" />
                    ) : (
                        <div>
                            <h3 className=" font-syne mt-8 text-3xl text-center">Seus convidados</h3>
                            {data.referrals.length === 0 ? (
                                <Card className=" mt-4">
                                    <CardHeader>
                                        <CardTitle className=" text-xl font-syne">Você ainda não convidou ninguém</CardTitle>
                                    </CardHeader>
                                    <CardDescription className=" text-center font-syne mb-8">Compartilhe seu link de afiliado e comece a ganhar moedas convidando seus amigos!</CardDescription>
                                </Card>
                            ) : (
                                <TableReferral referrals={data.referrals} />
                            )}

                        </div>
                    )}
                </>
            )}
            {/* </section> */}
        </main>
    )
}