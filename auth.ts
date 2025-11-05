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
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
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
    // ✅ 1. Сначала создаем/проверяем пользователя в БД
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user?.email;
        const name = user?.name || (profile as any)?.name || "GoogleUser";

        if (!email) {
          console.error("Google sign-in: No email provided");
          return false;
        }

        try {
          // Создаем пользователя, если его нет
          await sql`
            INSERT INTO users (name, email, password)
            VALUES (${name}, ${email}, ${null})
            ON CONFLICT (email) DO NOTHING
          `;
          console.log("✅ Google user ensured in DB:", email);
        } catch (e) {
          console.error("❌ Failed to create Google user:", e);
          return false;
        }
      }
      return true;
    },

    // ✅ 2. Теперь получаем userId (пользователь точно есть в БД)
    async jwt({ token, user, account }) {
      // При первом входе через Credentials
      if (user?.id) {
        token.userId = user.id;
        console.log("✅ JWT: userId from Credentials:", user.id);
      }

      // При первом входе через Google или при обновлении токена
      if (!token.userId && token.email) {
        const dbUser = await getUser(token.email);
        if (dbUser) {
          token.userId = dbUser.id;
          console.log(
            "✅ JWT: userId from DB:",
            dbUser.id,
            "for email:",
            token.email
          );
        } else {
          console.error("❌ JWT: No user found in DB for email:", token.email);
        }
      }

      return token as JWT & { userId?: string };
    },

    // ✅ 3. Передаем userId в сессию
    async session({ session, token }) {
      if (token?.userId) {
        // ts-expect-error расширяем тип
        session.user.id = token.userId as string;
        console.log("✅ Session: userId set:", token.userId);
      } else {
        console.error("❌ Session: No userId in token!");
      }
      return session;
    },

    ...authConfig.callbacks,
  },
});
