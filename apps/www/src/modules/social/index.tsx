"use client"
import { useApi } from "@/hooks/use-api"
import { Loader } from "@/components/loading-spinner"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Friend = {
    id: number
    username: string
    email: string
    picture: string
    last_entry: Date
    online: boolean
}

type FriendshipData = {
    sent: {
        id: number
        friend_id: number
        Friend: Friend
    }[]
    received: {
        id: number
        user_id: number
        User: Friend
    }[]
    online: Friend[]
    offline: Friend[]
}

export function Social({
    maxLg = false,
}: {
    maxLg?: boolean
}) {
    const { get } = useApi()
    const { data, isLoading, error } = useQuery<FriendshipData>({
        queryKey: ["friendship-data"],
        queryFn: async () => {
            const res = await get("/user/friendship-data")
            return res.data
        },
    })

    if (isLoading) {
        return <Loader />
    }

    if (error) {
        return <div>Error loading social data</div>
    }

    if (!data) {
        return <div>No data available</div>
    }

    return (
        <>
            <h1>Should</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
    )
}

