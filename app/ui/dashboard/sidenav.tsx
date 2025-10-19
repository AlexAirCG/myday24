import Link from "next/link";
import AcmeLogo from "../acme-logo";
import NavLinks from "./nav-links";
import { FaPowerOff } from "react-icons/fa6";
import { IoPowerSharp } from "react-icons/io5";

export default function SideNav() {
  return (
    <div className="flex flex-col p-2 md:h-full md:px-2">
      <Link
        className="mb-2 flex  items-center justify-between rounded-md bg-blue-600 p-2 md:h-40 bg-gradient-to-br from-blue-200 to-blue-600"
        href="/dashboard"
      >
        <div className=" text-white ">
          <AcmeLogo />
        </div>
        <form className="md:hidden">
          <button className=" rounded-md bg-gradient-to-br from-blue-200 to-blue-600 shadow-[0_4px_8px_rgba(0,0,0,0.5)] p-1 mr-2 hover:bg-gradient-to-bl hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 ">
            <IoPowerSharp className="w-6 h-6 text-amber-50" />
          </button>
        </form>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
      </div>
      <form className="hidden md:block">
        <button className="flex w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
          <FaPowerOff className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </form>
    </div>
  );
}
