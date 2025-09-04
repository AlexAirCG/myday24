"use server";
import { revalidatePath } from "next/cache";
import postgres from "postgres";
import z from "zod";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true });

export async function createTodoFetch(formData: FormData) {
  const { title } = CreateInvoice.parse({
    title: formData.get("title"),
  });

  await sql`
    INSERT INTO todo_myday (title)
    VALUES (${title})
  `;

  revalidatePath("/dashboard/todo");
}

export async function deleteTodoTask(title: string) {
  await sql`DELETE FROM todo_myday WHERE title = ${title}`;
  revalidatePath("/dashboard/todo");
}
