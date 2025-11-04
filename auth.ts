import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import type { JWT } from "next-auth/jwt";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await getUser(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // ВАЖНО: вернуть объект с id, чтобы jwt получил его сразу
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // при логине через Credentials user присутствует
      if (user?.id) token.userId = user.id;

      // при логине через Google user.id может не быть — достанем из БД по email
      if (!token.userId && token.email) {
        const dbUser = await getUser(token.email);
        if (dbUser) token.userId = dbUser.id;
      }
      return token as JWT & { userId?: string };
    },
    async session({ session, token }) {
      if (token?.userId) {
        // ts-expect-error расширяем тип
        session.user.id = token.userId as string;
      }
      return session;
    },
    // перетянем ваш authorized сюда (или оставьте в auth.config.ts)
    ...authConfig.callbacks,
  },

  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return;
      const email = user?.email;
      const name = user?.name || (profile as any)?.name || "GoogleUser";
      if (!email) return;
      try {
        await sql`
          INSERT INTO users (name, email, password)
          VALUES (${name}, ${email}, ${null})
          ON CONFLICT (email) DO NOTHING
        `;
      } catch (e) {
        console.error("Upsert Google user failed:", e);
      }
    },
  },
});
