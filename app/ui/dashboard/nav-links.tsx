"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaShopify } from "react-icons/fa6";
import { VscGraph } from "react-icons/vsc";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { CiMemoPad } from "react-icons/ci";

// Карта ссылок для отображения в боковой навигации.

export default function NavLinks() {
  const pathName = usePathname(); // текущий путь пользователя из URL.

  const base =
    "flex items-center h-10 gap-2 rounded-md bg-gray-200 px-3 text-[16px] font-medium hover:bg-sky-200 hover:text-blue-600 " +
    "whitespace-nowrap truncate overflow-hidden " +
    "w-[160px] flex-none justify-center " + // мобильные: фикс ширина
    "md:w-full md:flex-none md:justify-start"; // ПК: на всю ширину, высота фикс.

  return (
    <>
      <Link
        className={clsx(base, {
          "bg-sky-200 text-blue-600": pathName === "/dashboard",
        })}
        href={"/dashboard"}
      >
        <IoCalendarNumberOutline className="w-6 h-6" />
        Календарь
      </Link>
      <Link
        className={clsx(base, {
          "bg-sky-200 text-blue-600": pathName === "/dashboard/todo",
        })}
        href={"/dashboard/todo"}
      >
        <CiMemoPad className="w-6 h-6" />
        Дела
      </Link>
      <Link
        className={clsx(base, {
          "bg-sky-200 text-blue-600": pathName === "/dashboard/shop",
        })}
        href={"/dashboard/shop"}
      >
        <FaShopify className="w-6 h-6" />
        Покупки
      </Link>
      <Link
        className={clsx(base, {
          "bg-sky-200 text-blue-600": pathName === "/dashboard/graph",
        })}
        href={"/dashboard/graph"}
      >
        <VscGraph className="w-6 h-6" />
        График
      </Link>
    </>
  );
}
