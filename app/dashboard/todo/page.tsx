import { inter } from "@/app/ui/fonts";
import TableTodo from "@/app/ui/todo/table-todo";

export default async function Page() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${inter.className} text-2xl`}>Дела</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        {/* <Search placeholder="Search city..." /> */}
        {/* <CreateBatyInovoice /> */}
      </div>
      <TableTodo />
    </div>
  );
}
