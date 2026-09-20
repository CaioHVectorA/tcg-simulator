import { api } from "@/lib/api"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export function withAsyncPaginatedFetchedData(
    Component: React.ComponentType<any>,
    url: string,
) {
    return async function WithAsyncFetchedData({ searchParams }: {
        searchParams: Promise<Record<string, string | undefined>>
    }) {
        const sParams = (await searchParams) || {}
        const token = (await cookies()).get('token')?.value
        if (!token) {
            redirect('/entrar')
        }
        const options = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const query = new URLSearchParams()
            for (const [k, v] of Object.entries(sParams)) {
                if (v !== undefined && v !== null && v !== '') {
                    query.set(k, String(v))
                }
            }
            const queryString = query.toString() ? `?${query.toString()}` : ''
            const { data } = await api.get(`${url}${queryString}`, options)
            const payload = data?.data ?? data ?? {}
            return <Component
                data={payload.data || []}
                currentPage={payload.currentPage || 1}
                totalPages={payload.totalPages || 1}
                totalCards={payload.totalCards ?? (payload.data?.length || 0)}
                search={sParams.search || ""}
                filters={sParams}
            />
        } catch (err) {
            console.error('Error fetching paginated data:', err)
            redirect('/entrar')
            return null
        }
    }
}