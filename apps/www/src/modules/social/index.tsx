"use client"
import { useApi } from "@/hooks/use-api"
import { Loader } from "@/components/loading-spinner"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FriendList } from "./friends-list"
import { FriendRequests } from "./friend-requests"
import { MessageBox } from "./message-box"
import { MoneyTransfer } from "./money-transfer"
import { PrivateTradeRequest } from "./private-trade-request"

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
        <div className="w-full max-w-4xl mx-auto p-4">
            <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="requests">Requests</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                    <TabsTrigger value="trade">Trade</TabsTrigger>
                </TabsList>
                <TabsContent value="friends">
                    <FriendList online={data.online} offline={data.offline} />
                </TabsContent>
                <TabsContent value="requests">
                    <FriendRequests sent={data.sent} received={data.received} />
                </TabsContent>
                <TabsContent value="messages">
                    <MessageBox />
                </TabsContent>
                <TabsContent value="transfer">
                    <MoneyTransfer />
                </TabsContent>
                <TabsContent value="trade">
                    <PrivateTradeRequest />
                </TabsContent>
            </Tabs>
        </div>
    )
}

