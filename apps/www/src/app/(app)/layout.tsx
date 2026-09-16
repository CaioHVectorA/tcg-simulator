import { HeaderMenu } from "@/components/header";
import { Loader } from "@/components/loading-spinner";
import { QueryProvider } from "@/components/providers/query-provider";
import { UserProvider } from "@/context/UserContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { Suspense } from "react";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main>
            <QueryProvider>
                <UserProvider>
                    <WebSocketProvider>
                        <HeaderMenu />
                        {children}
                    </WebSocketProvider>
                </UserProvider>
            </QueryProvider>
        </main>
    );
}
