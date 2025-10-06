import postgres from "postgres";
import { Todo } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchTodo() {
  try {
    const todos = sql<Todo[]>`
      SELECT todo_myday.title, todo_myday.id
      FROM todo_myday
      ORDER BY sort_order ASC, id ASC
     `;
    return todos;
  } catch (error) {
    console.log("Database Error:", error);
    throw new Error("Filed to fetch Todo");
  }
}

export async function fetchTodoById(id: string) {
  try {
    const data = await sql<Todo[]>`
      SELECT
        todo_myday.id,
        todo_myday.title
      FROM todo_myday
      WHERE todo_myday.id = ${id};
    `;

    const todo = data.map((todo) => ({
      ...todo,
    }));

    return todo[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}
