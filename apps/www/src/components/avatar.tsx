import ReactNiceAvatar, { genConfig } from "react-nice-avatar"
import { cn } from '@/lib/utils'
export function Avatar({
    src,
    username,
    className
}: {
    src?: string,
    username: string,
    className?: string
}) {
    return <ReactNiceAvatar className={cn('h-12 min-w-12', className)} {...genConfig(username)} />
    if (!src || src == '/wallpaper.jpg') {
    }
    return <img src={src} alt={username} className={cn('h-12 min-w-12 rounded-full object-cover', className)} />
}