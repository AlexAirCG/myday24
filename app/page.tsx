import Link from "next/link";
import { lusitana } from "./ui/fonts";
import { CiLogin } from "react-icons/ci";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 justify-center items-center rounded-lg bg-blue-500 p-4 md:h-52">
        <div
          className={`${lusitana.className} flex items-center leading-none text-white`}
        >
          <p className="text-[44px]">myDay24</p>
        </div>
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <Link
          href="/login"
          className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
        >
          <span>Log in</span> <CiLogin className="w-8 h-8" />
        </Link>
      </div>
    </main>
  );
}
