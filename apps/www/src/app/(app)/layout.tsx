import { HeaderMenu } from "@/components/header";
import { QueryProvider } from "@/components/providers/query-provider";
import { UserProvider } from "@/context/UserContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main>
            <QueryProvider>
                <UserProvider>
                    <HeaderMenu />
                    {children}
                </UserProvider>
            </QueryProvider>
        </main>
    );
}
