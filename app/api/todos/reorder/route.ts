import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { auth } from "@/auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { ids } = (await req.json()) as { ids?: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    // // Обновляем sort_order по позиции в массиве
    // await sql`
    //   WITH data AS (
    //     SELECT id::uuid, ord::int AS pos
    //     FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS u(id, ord)
    //   )
    //   UPDATE todo_myday AS t
    //   SET sort_order = d.pos
    //   FROM data d
    //   WHERE t.id = d.id
    // `;
    // Обновляем только те id, которые принадлежат текущему пользователю
    await sql`
      WITH data AS (
        SELECT id::uuid, ord::int AS pos
        FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS u(id, ord)
      )
      UPDATE todo_myday AS t
      SET sort_order = d.pos
      FROM data d
      WHERE t.id = d.id AND t.user_id = ${userId}
    `;
    // Инвалидируем нужную страницу/сегмент
    revalidatePath("/dashboard/todo");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reorder error", err);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
