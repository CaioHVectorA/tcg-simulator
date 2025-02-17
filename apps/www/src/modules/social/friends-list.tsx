import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Friend } from "../social"

export function FriendList({ online, offline }: { online: Friend[]; offline: Friend[] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Friends</h2>
            <div>
                <h3 className="text-lg font-semibold mb-2">Online</h3>
                <ScrollArea className="h-[200px]">
                    {online.map((friend) => (
                        <FriendItem key={friend.id} friend={friend} />
                    ))}
                </ScrollArea>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Offline</h3>
                <ScrollArea className="h-[200px]">
                    {offline.map((friend) => (
                        <FriendItem key={friend.id} friend={friend} />
                    ))}
                </ScrollArea>
            </div>
        </div>
    )
}

function FriendItem({ friend }: { friend: Friend }) {
    return (
        <div className="flex items-center space-x-4 p-2">
            <Avatar>
                <AvatarImage src={friend.picture} alt={friend.username} />
                <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-medium">{friend.username}</p>
                <p className="text-sm text-gray-500">{friend.email}</p>
            </div>
            <Badge variant={friend.online ? "default" : "secondary"}>{friend.online ? "Online" : "Offline"}</Badge>
        </div>
    )
}

