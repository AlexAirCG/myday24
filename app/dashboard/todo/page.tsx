import { fetchTodo } from "@/app/lib/data";
import { inter } from "@/app/ui/fonts";
import TableTodoShop from "@/app/ui/shop/table-todo-shop";

export default async function Page() {
  const todos = await fetchTodo();
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${inter.className} text-2xl`}>Дела</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        {/* <Search placeholder="Search city..." /> */}
        {/* <CreateBatyInovoice /> */}
      </div>
      <TableTodoShop todos={todos} />
    </div>
  );
}
