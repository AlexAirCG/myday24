import postgres from "postgres";
import { Todo } from "./definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function fetchTodo() {
  try {
    const todos = sql<Todo[]>`
         SELECT todo_myday.title
         FROM todo_myday
        `;
    return todos;
  } catch (error) {
    console.log("Database Error:", error);
    throw new Error("Filed to fetch Todo");
  }
}
