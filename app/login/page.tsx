import AcmeLogo from "@/app/ui/acme-logo";

import { Suspense } from "react";
import LoginForm from "../ui/login-form";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-200 to-blue-600 shadow-[0_4px_8px_rgba(0,0,0,0.5)] p-3 h-20 md:h-25">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
