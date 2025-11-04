import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(rawEmail: string): Promise<User | undefined> {
  const email = rawEmail.toLowerCase();
  try {
    const user = await sql<User[]>`
  SELECT * FROM users WHERE lower(email) = ${email}
`;
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

        // const { email, password } = parsed.data;
        const { email: rawEmail, password } = parsed.data;
        const email = rawEmail.toLowerCase();
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
    async jwt({ token, user, account }) {
      // Если уже есть наш DB id — выходим
      if ((token as any).userId) return token;

      // Credentials: authorize() уже вернул id из БД
      if (account?.provider === "credentials" && user?.id) {
        (token as any).userId = user.id;
        return token;
      }

      // OAuth: берём email, находим/создаём пользователя в БД и сохраняем его id
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (!email) return token;

      const name = user?.name ?? token.name ?? "User";

      const rows = await sql<{ id: string }[]>`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${null})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

      const userId =
        rows[0]?.id ??
        (await (async () => {
          const r = await sql<{ id: string }[]>`
          SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1
        `;
          return r[0]?.id;
        })());

      if (userId) (token as any).userId = userId;
      return token;
    },

    async session({ session, token }) {
      if ((token as any).userId) {
        // ts-expect-error расширяем session.user
        session.user.id = (token as any).userId as string;
      }
      return session;
    },

    // оставить ваш authorized
    ...authConfig.callbacks,
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return;
      const rawEmail = user?.email;
      if (!rawEmail) return;
      const email = rawEmail.toLowerCase();
      const name = user?.name || (profile as any)?.name || "GoogleUser";
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
