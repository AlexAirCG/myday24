import AcmeLogo from "@/app/ui/acme-logo";
import { Suspense } from "react";
import RegisterForm from "../ui/register-form";

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:mt-20">
        {/* <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36"> */}
        <div className="flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-200 to-blue-600 shadow-[0_4px_8px_rgba(0,0,0,0.5)] p-3 h-20 md:h-25">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
