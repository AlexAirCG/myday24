"use client";
import { lusitana } from "@/app/ui/fonts";
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { Button } from "./button";
import { useActionState, useState } from "react";
import { authenticate } from "@/app/lib/actions";
import { useSearchParams } from "next/navigation";
import { signIn as signInClient } from "next-auth/react";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-200 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Войдите, чтобы продолжить
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              Пароль
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 pr-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 focus:outline-none"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-[18px] w-[18px]" />
                ) : (
                  <EyeIcon className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </div>
        </div>
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button
          className="h-10 px-4 mt-4 w-full text-shadow-lg/40 5 5"
          aria-disabled={isPending}
        >
          Войти <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>

        {/* Разделитель */}
        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="px-3 text-xs text-gray-500">или</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        {/* Кнопка Google */}
        <button
          type="button"
          onClick={() => signInClient("google", { redirectTo: callbackUrl })}
          className="h-10 w-full rounded-md bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-sm font-medium"
        >
          Войти с Google
        </button>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex h-8 items-end space-x-1"
        >
          {/* Add form errors here */}
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Нет аккаунта?{" "}
          <a className="text-blue-600 underline" href="/register">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </form>
  );
}
