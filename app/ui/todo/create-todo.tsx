import { createTodoFetch } from "@/app/lib/actions";

export default function CreateTodo() {
  return (
    <div className="">
      <form action={createTodoFetch} className="flex gap-2 mb-4">
        <input name="title" type="text" className="w-full border p-2 rounded" />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Добавить
        </button>
      </form>
    </div>
  );
}
