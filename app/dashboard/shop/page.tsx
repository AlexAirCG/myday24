import { fetchTodo } from "@/app/lib/data";
import { inter } from "@/app/ui/fonts";
import TableTodoShop from "@/app/ui/shop/table-todo-shop";
import CreateTodo from "@/app/ui/todo/create-todo";

export default async function Page() {
  const todos = await fetchTodo();
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${inter.className} text-2xl`}>Дела</h1>
      </div>
      <CreateTodo />
      <TableTodoShop todos={todos} />
    </div>
  );
}
