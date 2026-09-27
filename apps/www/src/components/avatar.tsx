import ReactNiceAvatar, { genConfig } from "react-nice-avatar"
import { cn } from '@/lib/utils'

export function Avatar({
    src,
    username,
    className
}: {
    src?: string,
    username?: string,
    className?: string
}) {
    const isCustomImage = Boolean(src && src.trim() !== "" && src !== "/wallpaper.jpg");

    if (isCustomImage) {
        return (
            <img
                src={src}
                alt={username || "Trainer Avatar"}
                className={cn('size-10 rounded-full object-cover border border-border/60 shadow-sm shrink-0', className)}
                onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                }}
            />
        );
    }

    return (
        <div className={cn('size-10 rounded-full overflow-hidden border border-border/60 shadow-sm shrink-0 flex items-center justify-center', className)}>
            <ReactNiceAvatar className="w-full h-full" {...genConfig(username && username.trim() !== "" ? username : "trainer")} />
        </div>
    );
}