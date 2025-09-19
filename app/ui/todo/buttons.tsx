import { deleteTodoTask } from "@/app/lib/actions";
import { PlusIcon } from "@heroicons/react/24/outline";
import { IoTrashOutline } from "react-icons/io5";
import Link from "next/link";
import { FiEdit3 } from "react-icons/fi";

export function CreateTodoTask() {
  return (
    <Link
      href="/dashboard/baty/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Invoice</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateInvoiceTodo({ id }: { id: string }) {
  return (
    <Link href={`/dashboard/todo/${id}/edit`} className="p-1">
      <FiEdit3 className="w-5 h-5 hover:text-green-700" />
    </Link>
  );
}

export function DeleteTodo({ title }: { title: string }) {
  const deleteTodoWithId = deleteTodoTask.bind(null, title);
  return (
    <form className="flex items-center" action={deleteTodoWithId}>
      <button className="p-1" type="submit">
        <IoTrashOutline className="w-5 h-5 cursor-pointer hover:text-red-500" />
      </button>
    </form>
  );
}
