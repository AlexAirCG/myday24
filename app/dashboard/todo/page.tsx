import { fetchTodo } from "@/app/lib/data";
import { inter } from "@/app/ui/fonts";
import TableTodoShop from "@/app/ui/shop/table-todo-shop";
import CreateTodo from "@/app/ui/todo/create-todo";

export default async function Page() {
  const todos = await fetchTodo();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Фиксированная шапка (не прокручивается) */}
      <div className="sticky top-0 z-10 flex flex-col w-full bg-amber-100 md:p-2">
        <h1 className={`${inter.className} text-2xl md:mb-6`}>Дела</h1>
        <CreateTodo />
      </div>

      {/* Прокручиваемая часть только для списка */}
      <div
        className="flex-1 min-h-0 overflow-y-auto md:p-2 overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TableTodoShop todos={todos} />
      </div>
    </div>
  );
}
