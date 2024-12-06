import { api } from "@/lib/api"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export function withAsyncPaginatedFetchedData(
    Component: React.ComponentType<{
        data: any,
        currentPage: number,
        totalPages: number,
        search: string
    }>,
    url: string,
) {
    return async function WithAsyncFetchedData({ searchParams }: {
        searchParams: Promise<{
            page: string,
            search: string
        }>
    }) {
        const sParams = await searchParams
        const token = (await cookies()).get('token')?.value
        if (!token) {
            redirect('/entrar')
        }
        // handle invalid token
        const options = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const page = sParams.page ? `?page=${sParams.page}` : ''
            const search = sParams.search ? page ? `&search=${sParams.search}` : `?search=${sParams.search}` : ''
            const { data } = await api.get(`${url}${page}${search}`, options)
            console.log(`Fetching ${url}${page}${search}`)
            console.log({ data })
            const payload = data.data ?? data
            return <Component
                data={payload.data || []}
                currentPage={payload.currentPage}
                totalPages={payload.totalPages}
                search={sParams.search}
            />
        } catch (err) {
            console.log('E')
            redirect('/entrar')
            return null
        }
    }
}