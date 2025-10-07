import { inter } from "@/app/ui/fonts";
import CreateTodo from "@/app/ui/todo/create-todo";

export default async function Page() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${inter.className} text-2xl`}>Дела</h1>
      </div>
      <CreateTodo />
      {/* <TableTodoShop todos={todos} /> */}
    </div>
  );
}
