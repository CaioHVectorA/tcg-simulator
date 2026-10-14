"use client"
import { LocalizedText, useUiText } from "@/i18n/localized-text";
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
import { Input } from '@/components/ui/input';
import { useUser } from "@/context/UserContext";
import { People } from "./people";

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
  const ui = useUiText();
    const { get } = useApi()
    const { data, isLoading, error } = useQuery<FriendshipData>({
        queryKey: ["friendship-data"],
        queryFn: async () => {
            const res = await get("/user/friendship-data")
            return res.data
        },
    })
    const { id } = useUser()
    const { handleFriendAction: { mutate } } = useFriendActions();
    const [friendId, setFriendId] = useState('');

    if (isLoading) {
        return <Loader />
    }

    if (error) {
        return <div><LocalizedText text={"Error loading social data"} /></div>
    }

    if (!data) {
        return <div><LocalizedText text={"No data available"} /></div>
    }
    return (
        <div className="px-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-syne"><LocalizedText text={"Social"} /></h1>
                <p className="text-sm text-gray-500"><LocalizedText text={"Seu ID: #"} />{id}</p>
            </div>
            <div className="flex items-center my-4">
                <Input
                    type="text"
                    placeholder={ui("ID do amigo")}
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    className="mr-2"
                />
                <Button onClick={() => {
                    mutate({ action: FriendAction.SendRequest, id: Number(friendId) });
                    setFriendId('');
                }}> <LocalizedText text={"Enviar Pedido"} /> </Button>
            </div>
            <Accordion type="single" collapsible>
                <AccordionItem value="online">
                    <AccordionTrigger><LocalizedText text={"Amigos Online ("} />{data.online.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.online.map((friend) => (
                                <People key={friend.id} friend={friend} />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="offline">
                    <AccordionTrigger><LocalizedText text={"Amigos Offline ("} />{data.offline.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.offline.map((friend) => (
                                <People key={friend.id} friend={friend} />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="received">
                    <AccordionTrigger><LocalizedText text={"Solicitações Recebidas ("} />{data.received.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.received.map((request) => (
                                <div key={request.id} className="flex items-center space-x-4">
                                    <Avatar src={request.User.picture} username={request.User.username} />
                                    <div>
                                        <h2 className="text-lg font-semibold">{request.User.username}</h2>

                                        <Button size={"icon"} onClick={() => mutate({ action: FriendAction.Accept, id: request.id })} className="bg-green-500 rounded-full text-white size-6 mr-1">
                                            <Check />
                                        </Button>
                                        <Button size={"icon"} variant="outline" onClick={() => mutate({ action: FriendAction.RemoveRequest, id: request.id })} className="bg-red-500 rounded-full text-white size-6">
                                            <X />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sent">
                    <AccordionTrigger><LocalizedText text={"Solicitações Enviadas ("} />{data.sent.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                            {data.sent.map((request) => (
                                <div key={request.id} className="flex items-center justify-between">
                                    <div key={request.id} className="flex items-center space-x-4">
                                        <Avatar src={request.Friend.picture} username={request.Friend.username} />
                                        <div>
                                            <h2 className="text-lg font-semibold line-clamp-1">{request.Friend.username}</h2>
                                            <p className="text-sm text-gray-500"><LocalizedText text={"Solicitação Enviada"} /></p>
                                        </div>
                                    </div>
                                    <Button size={"icon"} variant="outline" onClick={() => mutate({ action: FriendAction.CancelRequest, id: request.id })} className="bg-red-500 rounded-full text-white size-6">
                                        <X />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

        </div>
    )
}

