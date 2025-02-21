import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
const handler = NextAuth({
  secret: "TEST",
  theme: {
    logo: "https://www.tcgsim.com/wallpaper.jpg",
    buttonText: "Entrar com sua conta google!",
    brandColor: "#000",
    colorScheme: "light",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.SECRET_GOOGLE!,
    }),
  ],
});

export { handler as GET, handler as POST };
