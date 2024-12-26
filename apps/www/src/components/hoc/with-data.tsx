import { api } from "@/lib/api"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export function withAsyncFetchedData(
    Component: React.ComponentType<{ data: any }>,
    url: string,
) {
    return async function WithAsyncFetchedData() {
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
            const { data } = await api.get(url, options)
            // handle error, invalid data, etc
            return <Component data={data.data ?? data} />
        } catch (err) {
            console.log(err)
            // redirect('/entrar')
            return null
        }
    }
}