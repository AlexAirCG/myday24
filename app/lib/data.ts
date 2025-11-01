import postgres from "postgres";
import { Todo } from "./definitions";
import { auth } from "@/auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchTodo() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  try {
    const todos = sql<Todo[]>`
      SELECT id, title, completed
      FROM todo_myday
      WHERE user_id = ${userId}
      ORDER BY sort_order ASC, id ASC
     `;
    return todos;
  } catch (error) {
    console.log("Database Error:", error);
    throw new Error("Filed to fetch Todo");
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
