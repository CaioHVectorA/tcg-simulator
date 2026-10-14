import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
const secret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("NEXTAUTH_SECRET must contain at least 32 characters in production");
}
const handler = NextAuth({
  secret,
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.SECRET_GOOGLE || "",
  })],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google") token.googleIdToken = account.id_token;
      return token;
    },
  },
});
export { handler as GET, handler as POST };
