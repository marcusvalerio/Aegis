import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel auto-detects its own proxy; any other host behind a reverse proxy
  // (Railway, Fly, Render, a plain Docker/nginx setup, ...) needs this to
  // trust X-Forwarded-* headers, or cookie/callback URLs resolve to http://
  // and break login. Off by default so a misconfigured deploy fails loudly
  // instead of trusting headers it shouldn't.
  trustHost: process.env.AUTH_TRUST_HOST === "true" || Boolean(process.env.VERCEL),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "ADMIN" | "OPERADOR",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN" | "OPERADOR";
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
