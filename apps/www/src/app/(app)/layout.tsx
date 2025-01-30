import { HeaderMenu } from "@/components/header";
import { Loader } from "@/components/loading-spinner";
import { QueryProvider } from "@/components/providers/query-provider";
import { SideMenu } from "@/components/sidebar";
import { UserProvider } from "@/context/UserContext";
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
                    {/* <SideMenu /> */}
                    <HeaderMenu />
                    {children}
                </UserProvider>
            </QueryProvider>
        </main>
    );
}
