import { Avatar } from "@/components/avatar";
import { Friend } from ".";

export function People({ friend }: { friend: Friend }) {
    if (!friend) return null;
    return (
        <div key={friend.id} className="flex items-center space-x-4">
            <Avatar src={friend.picture} username={friend.username} />
            <div>
                <h2 className="text-lg font-semibold">{friend.username}</h2>
                <p className="text-sm text-gray-500">Online</p>
            </div>
        </div>
    )
}
