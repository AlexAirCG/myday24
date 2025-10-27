"use client";

import { Todo } from "@/app/lib/definitions";
import Link from "next/link";

import { updateTodo } from "@/app/lib/actions";
import { Button } from "../button";

export default function EditTodo({ title }: { title: Todo }) {
  const updateTodoWithId = updateTodo.bind(null, title.id);
  return (
    <form action={updateTodoWithId}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Invoice Amount */}
        <div className="mb-4">
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="id"
                name="title"
                type="text"
                defaultValue={title.title}
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/todo"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Передумал
        </Link>
        <Button className="px-3 text-shadow-lg/40" type="submit">
          Редактировать
        </Button>
      </div>
    </form>
  );
}
