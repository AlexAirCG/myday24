"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaShopify } from "react-icons/fa6";
import { LuListTodo } from "react-icons/lu";
import { IoCalendarNumberOutline } from "react-icons/io5";

// Карта ссылок для отображения в боковой навигации.

export default function NavLinks() {
  const pathName = usePathname(); // текущий путь пользователя из URL.
  return (
    <>
      <Link
        className={clsx(
          "flex grow items-center justify-center gap-2 rounded-md bg-gray-200 p-2 text-[16px] font-medium hover:bg-sky-200 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
          {
            "bg-sky-200 text-blue-600": pathName === "/dashboard",
          }
        )}
        href={"/dashboard"}
      >
        <IoCalendarNumberOutline className="w-6 h-6" />
        Календарь
      </Link>
      <Link
        className={clsx(
          "flex  grow items-center justify-center gap-2 rounded-md bg-gray-200 p-2 text-[16px] font-medium hover:bg-sky-200 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
          {
            "bg-sky-200 text-blue-600": pathName === "/dashboard/todo",
          }
        )}
        href={"/dashboard/todo"}
      >
        <LuListTodo className="w-6 h-6" />
        Дела
      </Link>
      <Link
        className={clsx(
          "flex grow items-center justify-center gap-2 rounded-md bg-gray-200 p-2 text-[16px] font-medium hover:bg-sky-200 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
          {
            "bg-sky-200 text-blue-600": pathName === "/dashboard/shop",
          }
        )}
        href={"/dashboard/shop"}
      >
        <FaShopify className="w-6 h-6" />
        Покупки
      </Link>
    </>
  );
}
