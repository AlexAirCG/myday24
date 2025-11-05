import postgres from "postgres";
import { Todo, User } from "./definitions";
import { auth } from "@/auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchTodo() {
  const session = await auth();
  const userId = session?.user?.id;

  console.log("📋 fetchTodo called");
  console.log("   Session:", JSON.stringify(session, null, 2));
  console.log("   UserId:", userId);

  // if (!userId) return [];
  if (!userId) {
    console.warn("⚠️ No userId in session!");
    return [];
  }

  try {
    const todos = await sql<Todo[]>`
      SELECT id, title, completed, user_id
      FROM todo_myday
      WHERE user_id = ${userId}
      ORDER BY sort_order ASC, id ASC
    `;
    console.log(`✅ Found ${todos.length} todos for user ${userId}`);
    return todos;
  } catch (error) {
    console.error("❌ Database Error:", error);
    throw new Error("Failed to fetch Todo");
  }
}

export async function fetchTodoById(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  try {
    const data = await sql<Todo[]>`
      SELECT id, title, completed
      FROM todo_myday
      WHERE id = ${id} AND user_id = ${userId};
    `;

    return data[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

// ✅ Возвращаем email текущего пользователя (одну строку)
export async function fetchUserEmail(): Promise<string | null> {
  try {
    const session = await auth();
    // // Можно взять прямо из сессии, если она надежно содержит email:
    const sessionEmail = session?.user?.email ?? null;
    if (sessionEmail) return sessionEmail;

    // Или запасной вариант — по id из БД:
    const userId = session?.user?.id;
    if (!userId) return null;

    const rows = await sql<{ email: string }[]>`
      SELECT email
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;
    return rows[0]?.email ?? null;
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}
