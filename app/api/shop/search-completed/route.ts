import { NextResponse } from "next/server";
import postgres from "postgres";
import { auth } from "@/auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const rows = await sql<{ id: string; title: string }[]>`
    SELECT id, title
    FROM todo_myday
    WHERE user_id=${userId}
      AND completed = true
      AND title ILIKE ${"%" + q + "%"}
    ORDER BY title ASC
    LIMIT 10
  `;

  return NextResponse.json({ items: rows });
}
