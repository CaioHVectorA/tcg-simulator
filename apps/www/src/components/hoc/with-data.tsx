import { api } from "@/lib/api"
import { cookies } from "next/headers"

export function withAsyncFetchedData<T>(
    Component: React.ComponentType<{ data: T }>,
    url: string,
) {
    return async function WithAsyncFetchedData() {
        const token = (await cookies()).get('token')?.value
        if (!token) {
            return null
        }
        // handle invalid token
        const options = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const { data } = await api.get<T>(url, options)
        // handle error, invalid data, etc
        return <Component data={data} />
    }
}