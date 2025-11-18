"use server";
import { revalidatePath } from "next/cache";
import postgres from "postgres";
import z from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const UpdateTitleSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Пустой заголовок"),
});

const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
});
// + схема для удаления по id
const DeleteSchema = z.object({
  id: z.uuid(),
});

export type UpdateState = { ok: boolean; id?: string; error?: string };
export type DeleteState = { ok: boolean; id?: string; error?: string };

// Создание задачи - добавляем в НАЧАЛО списка
export async function createTodoFetch(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

  console.log("Creating todo for userId:", userId);

  if (!userId) throw new Error("Unauthorized");

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  // Получаем минимальный sort_order среди всех задач пользователя
  const minSortOrder = await sql<{ min: number | null }[]>`
    SELECT MIN(sort_order) as min
    FROM todo_myday
    WHERE user_id=${userId}
  `;

  // Новая задача получит sort_order меньше минимального
  const newSortOrder = (minSortOrder[0]?.min ?? 1) - 1;

  await sql`
    INSERT INTO todo_myday (id, title, completed, sort_order, user_id)
    VALUES (gen_random_uuid(), ${title}, false, ${newSortOrder}, ${userId})
  `;

  revalidatePath("/dashboard/todo");
}

export async function updateTodoInline(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const parsed = UpdateTitleSchema.safeParse({
    id: String(formData.get("id") || ""),
    title: String(formData.get("title") || ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ошибка валидации",
    };
  }

  const { id, title } = parsed.data;

  await sql`
    UPDATE todo_myday
    SET title=${title}
    WHERE id=${id} AND user_id=${userId}
  `;

  revalidatePath("/dashboard/shop");

  return { ok: true, id };
}

export async function deleteTodoTask(_prev: DeleteState, formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const id = String(formData.get("id") ?? "");
  const parsed = DeleteSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, id, error: "Неверный id" };
  }

  try {
    await sql`DELETE FROM todo_myday WHERE id = ${id} AND user_id = ${userId}`;
    revalidatePath("/dashboard/todo");
    return { ok: true, id };
  } catch {
    return { ok: false, id, error: "Ошибка удаления" };
  }
}

// Переключение статуса - при снятии галочки переносим наверх
export async function toggleTodo(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  // Получаем текущее состояние задачи
  const currentTask = await sql<{ completed: boolean }[]>`
    SELECT completed
    FROM todo_myday
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!currentTask.length) throw new Error("Task not found");

  const willBeCompleted = !currentTask[0].completed;

  if (willBeCompleted) {
    await sql.begin(async (trx) => {
      await trx`
        UPDATE todo_myday
        SET completed = true
        WHERE id = ${id} AND user_id = ${userId}
      `;
      await trx`
        INSERT INTO todo_usage (task_id, user_id) VALUES (${id}, ${userId})
      `;
    });
  } else {
    // Задача становится невыполненной - переносим в начало списка
    const minSortOrder = await sql<{ min: number | null }[]>`
      SELECT MIN(sort_order) as min
      FROM todo_myday
      WHERE user_id=${userId}
    `;

    const newSortOrder = (minSortOrder[0]?.min ?? 1) - 1;

    await sql`
      UPDATE todo_myday
      SET completed = false, sort_order = ${newSortOrder}
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }
  // if (willBeCompleted) {
  //   // Задача становится выполненной - просто меняем статус
  //   await sql`
  //     UPDATE todo_myday
  //     SET completed = true
  //     WHERE id = ${id} AND user_id = ${userId}
  //   `;
  // } else {
  //   // Задача становится невыполненной - переносим в начало списка
  //   const minSortOrder = await sql<{ min: number | null }[]>`
  //     SELECT MIN(sort_order) as min
  //     FROM todo_myday
  //     WHERE user_id=${userId}
  //   `;

  //   const newSortOrder = (minSortOrder[0]?.min ?? 1) - 1;

  //   await sql`
  //     UPDATE todo_myday
  //     SET completed = false, sort_order = ${newSortOrder}
  //     WHERE id = ${id} AND user_id = ${userId}
  //   `;
  // }

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
          return "Неверный логин или пароль.";
        default:
          return "Что то пошло не так.";
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
