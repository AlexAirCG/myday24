"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import z from "zod";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true });
// Создание задачи
export async function createTodoFetch(formData: FormData) {
  const { title } = CreateInvoice.parse({
    title: formData.get("title"),
  });

  await sql`
    INSERT INTO todo_myday (title, sort_order)
    VALUES (${title}, 1)
  `;

  revalidatePath("/dashboard/todo");
}
// Изменение задачи
export async function updateTodo(id: string, formData: FormData) {
  const { title } = FormSchema.parse({
    title: formData.get("title"),
    id: formData.get("id") ?? "", // Использует пустую строку, если null
  });

  await sql`
    UPDATE todo_myday
    SET title = ${title}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/todo");
  redirect("/dashboard/todo");
}
// Удаление задачи
export async function deleteTodoTask(title: string) {
  await sql`DELETE FROM todo_myday WHERE title = ${title}`;
  revalidatePath("/dashboard/todo");
}
