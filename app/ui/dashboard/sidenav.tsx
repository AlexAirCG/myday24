import Link from "next/link";
import AcmeLogo from "../acme-logo";
import NavLinks from "./nav-links";
import { FaPowerOff } from "react-icons/fa6";
import { IoPowerSharp } from "react-icons/io5";
import { signOut } from "@/auth";
import { Button } from "../button";
import { SubmitButton } from "../submit-button";

export default function SideNav() {
  return (
    <div className="flex flex-col p-2 md:h-full md:px-2">
      <div className="mb-2 flex  items-center justify-between rounded-md bg-blue-600 p-2 md:h-40 bg-gradient-to-br from-blue-200 to-blue-600">
        <Link href="/dashboard">
          <div className=" text-white ">
            <AcmeLogo />
          </div>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="md:hidden"
        >
          {/* <Button type="submit" className="py-1 px-2">
            <IoPowerSharp className="w-6 h-6 text-amber-50 " />
          </Button> */}
          <SubmitButton className="py-1 px-2">
            <IoPowerSharp className="w-6 h-6 text-amber-50" />
          </SubmitButton>
        </form>
      </div>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="hidden md:block"
      >
        <button className="flex w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
          <FaPowerOff className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </form>
    </div>
  );
}
