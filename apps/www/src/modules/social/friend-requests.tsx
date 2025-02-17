import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Friend } from "../social"

type FriendRequest = {
    id: number
    friend_id: number
    Friend: Friend
}

type ReceivedRequest = {
    id: number
    user_id: number
    User: Friend
}

export function FriendRequests({ sent, received }: { sent: FriendRequest[]; received: ReceivedRequest[] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Friend Requests</h2>
            <div>
                <h3 className="text-lg font-semibold mb-2">Sent Requests</h3>
                <ScrollArea className="h-[200px]">
                    {sent.map((request) => (
                        <RequestItem key={request.id} friend={request.Friend} type="sent" />
                    ))}
                </ScrollArea>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Received Requests</h3>
                <ScrollArea className="h-[200px]">
                    {received.map((request) => (
                        <RequestItem key={request.id} friend={request.User} type="received" />
                    ))}
                </ScrollArea>
            </div>
        </div>
    )
}

function RequestItem({ friend, type }: { friend: Friend; type: "sent" | "received" }) {
    return (
        <div className="flex items-center justify-between space-x-4 p-2">
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={friend.picture} alt={friend.username} />
                    <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                </div>
            </div>
            {type === "received" && (
                <div>
                    <Button size="sm" className="mr-2">
                        Accept
                    </Button>
                    <Button size="sm" variant="outline">
                        Decline
                    </Button>
                </div>
            )}
            {type === "sent" && (
                <Button size="sm" variant="outline">
                    Cancel
                </Button>
            )}
        </div>
    )
}

