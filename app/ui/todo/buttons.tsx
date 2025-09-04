import { deleteTodoTask } from "@/app/lib/actions";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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

export function DeleteTodo({ title }: { title: string }) {
  const deleteTodoWithId = deleteTodoTask.bind(null, title);
  return (
    <form action={deleteTodoWithId}>
      <button type="submit">Delete</button>
    </form>
  );
}
