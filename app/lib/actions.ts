"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import z from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

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

// Зделанные задачи
export async function toggleTodo(id: string) {
  await sql`
    UPDATE todo_myday
    SET completed = NOT completed
    WHERE id = ${id}
  `;
  revalidatePath("/dashboard/todo");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

// регистрация пользователя
// Состояние для useActionState
export type RegisterState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "email" | "password" | "confirm", string>>;
};

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Введите имя"),
    email: z.email("Некорректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirm: z.string().min(6),
    redirectTo: z.string().optional(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

export async function register(
  _prev: RegisterState | undefined,
  formData: FormData
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    redirectTo: formData.get("redirectTo") || "/dashboard",
  });

  if (!parsed.success) {
    const fieldErrors: RegisterState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<RegisterState["errors"]>;
      fieldErrors[key] = issue.message;
    }
    return { ok: false, errors: fieldErrors };
  }

  const { name, email, password, redirectTo } = parsed.data;

  // Проверка существования email
  const exists = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM users WHERE email=${email}) as exists
  `;
  if (exists[0]?.exists) {
    return {
      ok: false,
      errors: { email: "Пользователь с таким email уже существует" },
    };
  }

  // Хэш пароля и вставка
  const hash = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (name, email, password)
    VALUES (${name}, ${email}, ${hash})
  `;

  // На всякий случай инвалидация где нужно (если есть зависимые списки/страницы)
  revalidatePath("/");

  // Автовход после регистрации
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/dashboard",
    });
    // signIn бросит редирект — сюда обычно не дойдём
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Если логин не удался — не критично, просим залогиниться вручную
      return {
        ok: true,
        message: "Аккаунт создан. Войдите, используя свой email и пароль.",
      };
    }
    throw error;
  }
}
