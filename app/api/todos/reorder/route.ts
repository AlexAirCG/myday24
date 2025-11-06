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

    // Используем транзакцию
    await sql.begin(async (tx) => {
      // Option 1: Using unnest (PostgreSQL)
      await tx`
    WITH new_orders AS (
      SELECT unnest(${sql.array(ids)}::uuid[]) AS id,
             unnest(${sql.array(ids.map((_, i) => i + 1))}::int[]) AS new_order
    )
    UPDATE todo_myday
    SET sort_order = new_orders.new_order
    FROM new_orders
    WHERE todo_myday.id = new_orders.id 
      AND todo_myday.user_id = ${userId}
  `;
    });

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
