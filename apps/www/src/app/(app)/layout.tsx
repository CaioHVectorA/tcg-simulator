import { HeaderMenu } from "@/components/header";
import { UserProvider } from "@/context/UserContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main>
            <UserProvider>
                <HeaderMenu />
                {children}
            </UserProvider>
        </main>
    );
}
