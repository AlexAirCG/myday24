"use client";
import {
  CalendarDateRangeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Карта ссылок для отображения в боковой навигации.
const links = [
  { name: "Календарь", href: "/dashboard", icon: CalendarDateRangeIcon },
  {
    name: "Дела",
    href: "/dashboard/todo",
    icon: ClipboardDocumentListIcon,
  },
  { name: "Покупки", href: "/dashboard/shop", icon: ShoppingCartIcon },
];

export default function NavLinks() {
  const pathName = usePathname(); // текущий путь пользователя из URL.
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-200 p-3 text-[16px] font-medium hover:bg-sky-200 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-200 text-blue-600": pathName === link.href,
              }
            )}
          >
            <LinkIcon className="w-7" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
