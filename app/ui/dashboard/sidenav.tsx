import Link from "next/link";
import AcmeLogo from "../acme-logo";
import NavLinks from "./nav-links";
import { FaPowerOff } from "react-icons/fa6";
import { IoPowerSharp } from "react-icons/io5";
import { signOut } from "@/auth";
import { SubmitButton } from "../submit-button";

type SideNavProps = { email?: string | null };

export default function SideNav({ email }: SideNavProps) {
  return (
    <div className="flex flex-col p-2 md:h-full md:px-2">
      <div className="mb-2 flex md:flex-col items-center md:justify-center justify-between rounded-md bg-blue-600 p-2 md:h-40 bg-gradient-to-br from-blue-200 to-blue-600">
        <Link href="/dashboard">
          <div className=" text-white pr-2">
            <AcmeLogo />
          </div>
        </Link>
        <div
          className="text-white text-sm md:text-base truncate "
          title={email ?? ""}
        >
          {email ?? ""}
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="md:hidden"
        >
          <SubmitButton className="py-1 px-2">
            <IoPowerSharp className="w-6 h-6 text-amber-50" />
          </SubmitButton>
        </form>
      </div>
      <div
        className="
            flex grow flex-row md:flex-col
            space-x-2 md:space-x-0 md:space-y-2
            overflow-x-auto md:overflow-visible
            whitespace-nowrap md:whitespace-normal
            [&>*]:flex-shrink-0 md:[&>*]:flex-shrink
            scroll-smooth
           -mr-4 pr-4 md:mr-0 md:pr-0
           -ml-2 pl-2 md:ml-0 md:pl-0 
           [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        "
      >
        <NavLinks />

        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        {/* тонкая «шторка» на правом краю — только на мобильных */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-2 md:hidden bg-gradient-to-l from-white to-transparent dark:from-gray-900"></div>
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
