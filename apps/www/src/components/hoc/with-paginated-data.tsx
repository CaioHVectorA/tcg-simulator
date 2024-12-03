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
        searchParams: {
            page: string,
            search: string
        }
    }) {
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
            const page = searchParams.page ? `?page=${searchParams.page}` : ''
            const search = searchParams.search ? page ? `&search=${searchParams.search}` : `?search=${searchParams.search}` : ''
            const { data } = await api.get(`${url}${page}${search}`, options)
            console.log(`Fetching ${url}${page}${search}`)
            console.log({ data })
            const payload = data.data ?? data
            return <Component
                data={payload.data || []}
                currentPage={payload.currentPage}
                totalPages={payload.totalPages}
                search={searchParams.search}
            />
        } catch (err) {
            console.log('E')
            redirect('/entrar')
            return null
        }
    }
}