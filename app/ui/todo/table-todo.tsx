import { fetchTodo } from "@/app/lib/data";
import { TbArrowsUpDown } from "react-icons/tb";
import CreateTodo from "./create-todo";
import { DeleteTodo, UpdateInvoiceTodo } from "./buttons";

export default async function TableTodo() {
  const todos = await fetchTodo();

  return (
    <div className="flow-root">
      <div className=" min-w-full text-gray-900">
        <CreateTodo />
        <div className="bg-amber-100">
          {todos.map((todo, index) => (
            <div
              key={index}
              className="flex items-center bg-white border-gray-500 border-2 md:border-3 mb-1 md:mb-2 rounded w-full text-sm"
            >
              <div className="p-1 md:p-2">
                <TbArrowsUpDown className="w-5 h-5 cursor-grab" />
              </div>
              <div className="w-full">{todo.title}</div>
              <div className="flex p-1 md:p-1 items-center justify-end">
                <UpdateInvoiceTodo id={todo.id} />
                <DeleteTodo title={todo.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
