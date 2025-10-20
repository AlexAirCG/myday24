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
// + схема для удаления по id
const DeleteSchema = z.object({
  id: z.uuid(),
});

export async function createTodoFetch(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  await sql`
    INSERT INTO todo_myday (id, title, completed, sort_order)
    VALUES (gen_random_uuid(), ${title}, false,
      COALESCE((SELECT MAX(sort_order) + 1 FROM todo_myday), 1)
    )
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

// ВАЖНО: теперь удаляем по id и возвращаем состояние для useFormState
export type DeleteState = { ok: boolean; id?: string; error?: string };
export async function deleteTodoTask(
  _prevState: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const id = String(formData.get("id") ?? "");
  const parsed = DeleteSchema.safeParse({ id });

  if (!parsed.success) {
    return { ok: false, id, error: "Неверный id" };
  }

  try {
    await sql`DELETE FROM todo_myday WHERE id = ${id}`;
    revalidatePath("/dashboard/todo");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, id, error: "Ошибка удаления" };
  }
}
// Удаление задачи
// export async function deleteTodoTask(title: string) {
//   await sql`DELETE FROM todo_myday WHERE title = ${title}`;
//   revalidatePath("/dashboard/todo");
// }

// Зделанные задачи
export async function toggleTodo(id: string) {
  await sql`
    UPDATE todo_myday
    SET completed = NOT completed
    WHERE id = ${id}
  `;
  revalidatePath("/dashboard/todo");
}
