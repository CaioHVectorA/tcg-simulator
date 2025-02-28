"use client"
import { useApi } from "@/hooks/use-api"
import { Loader } from "@/components/loading-spinner"
import { useQuery } from "@tanstack/react-query"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useState, useEffect } from 'react';
import { FriendAction, useFriendActions } from "@/hooks/use-friend-actions";
import { Avatar } from "@/components/avatar";
import { useWebSocket } from "@/context/WebSocketContext";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
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

    const { sendMessage, sendFriendRequest, sendTradeRequest } = useWebSocket();
    const { handleFriendAction: { mutate } } = useFriendActions();
    const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);

    useEffect(() => {
        if (data) {
            setOnlineFriends(data.online);
        }
    }, [data]);

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
        <div className="px-4">
            <h1 className="text-3xl font-bold font-syne">Social</h1>
            <Accordion type="single" collapsible>
                <AccordionItem value="online">
                    <AccordionTrigger>Amigos Online ({onlineFriends.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {onlineFriends.map((friend) => (
                                <div key={friend.id} className="flex items-center space-x-4">
                                    <Avatar src={friend.picture} username={friend.username} />
                                    <div>
                                        <h2 className="text-lg font-semibold">{friend.username}</h2>
                                        <p className="text-sm text-gray-500">Online</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="offline">
                    <AccordionTrigger>Amigos Offline ({data.offline.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.offline.map((friend) => (
                                <div key={friend.id} className="flex items-center space-x-4">
                                    <Avatar src={friend.picture} username={friend.username} />
                                    <div>
                                        <h2 className="text-lg font-semibold">{friend.username}</h2>
                                        <p className="text-sm text-gray-500">Offline</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="received">
                    <AccordionTrigger>Solicitações Recebidas ({data.received.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.received.map((request) => (
                                <div key={request.id} className="flex items-center space-x-4">
                                    <Avatar src={request.User.picture} username={request.User.username} />
                                    <div>
                                        <h2 className="text-lg font-semibold">{request.User.username}</h2>

                                        <Button size={'icon'} onClick={() => mutate({ action: FriendAction.Accept, id: request.id })} className="bg-green-500 rounded-full text-white size-6 mr-1">
                                            <Check />
                                        </Button>
                                        <Button size={'icon'} variant="outline" onClick={() => mutate({ action: FriendAction.RemoveRequest, id: request.id })} className="bg-red-500 rounded-full text-white size-6">
                                            <X />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sent">
                    <AccordionTrigger>Solicitações Enviadas ({data.sent.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.sent.map((request) => (
                                <div key={request.id} className="flex items-center space-x-4">
                                    <Avatar src={request.Friend.picture} username={request.Friend.username} />
                                    <div>
                                        <h2 className="text-lg font-semibold line-clamp-1">{request.Friend.username}</h2>
                                        <p className="text-sm text-gray-500">Solicitação Enviada</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

