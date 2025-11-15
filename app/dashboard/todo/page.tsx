import { fetchTodo } from "@/app/lib/data";
import { Button } from "@/app/ui/button";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Page() {
  const todos = await fetchTodo();
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden  ">
      <div className="flex justify-center items-center text-[18px] text-blue-800 gap-3">
        На сегодня дел нет <Button className="p-2">Добавить</Button>
      </div>
      <Image
        src="/lazy_cat.jpg"
        alt="lazy_cat"
        width={300}
        height={300}
        priority={true}
        className="rounded-lg m-5 shadow-[0_8px_12px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
