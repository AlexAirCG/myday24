"use client";
import { DeleteState, deleteTodoTask } from "@/app/lib/actions";
import { PlusIcon } from "@heroicons/react/24/outline";
import { IoTrashOutline } from "react-icons/io5";
import Link from "next/link";
import { FiEdit3 } from "react-icons/fi";
import { useActionState, useEffect } from "react";

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
    <Link href={`/dashboard/todo/${id}/edit`}>
      <button className="p-1 border-gray-500 border-2 rounded hover:border-blue-700 cursor-pointer active:bg-blue-700 transition-colors duration-150 ease-out">
        <FiEdit3 className="w-5 h-5 hover:text-blue-700 " />
      </button>
    </Link>
  );
}

export function DeleteTodo({
  id,
  onOptimisticDelete,
  onRevert,
}: {
  id: string;
  onOptimisticDelete?: () => void;
  onRevert?: () => void;
}) {
  const [state, formAction] = useActionState<DeleteState, FormData>(
    deleteTodoTask,
    { ok: true }
  );

  useEffect(() => {
    // если сервер вернул ошибку — откатываем локальный список
    if (state && state.ok === false && state.id === id) {
      onRevert?.();
    }
  }, [state, id, onRevert]);

  return (
    <form
      className="flex items-center"
      action={formAction}
      onSubmit={() => {
        // оптимистично удаляем в родительском списке
        onOptimisticDelete?.();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="p-1 border-gray-500 border-2 rounded hover:border-red-700 ml-1 cursor-pointer active:bg-red-700 transition-colors duration-150 ease-out"
        type="submit"
        aria-label="Удалить"
        title="Удалить"
      >
        <IoTrashOutline className="w-5 h-5 hover:text-red-700" />
      </button>
    </form>
  );
}
