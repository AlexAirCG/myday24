"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import {
  AtSymbolIcon,
  KeyIcon,
  UserIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { register, type RegisterState } from "@/app/lib/actions";
import { Button } from "./button";
import { lusitana } from "@/app/ui/fonts";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [state, formAction, isPending] = useActionState<
    RegisterState,
    FormData
  >(register, { ok: false });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-200 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Создайте аккаунт
        </h1>

        <div className="w-full">
          {/* Name */}
          <label
            className="mb-2 mt-3 block text-xs font-medium text-gray-900"
            htmlFor="name"
          >
            Имя
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="name"
              name="name"
              type="text"
              placeholder="Ваше имя"
              required
            />
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          {state?.errors?.name && (
            <p className="mt-1 text-xs text-red-500">{state.errors.name}</p>
          )}

          {/* Email */}
          <label
            className="mb-2 mt-4 block text-xs font-medium text-gray-900"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-500">{state.errors.email}</p>
          )}

          {/* Password */}
          <label
            className="mb-2 mt-4 block text-xs font-medium text-gray-900"
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
              placeholder="Минимум 6 символов"
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
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-500">{state.errors.password}</p>
          )}

          {/* Confirm */}
          <label
            className="mb-2 mt-4 block text-xs font-medium text-gray-900"
            htmlFor="confirm"
          >
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 pr-10 text-sm outline-2 placeholder:text-gray-500"
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Повторите пароль"
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
          {state?.errors?.confirm && (
            <p className="mt-1 text-xs text-red-500">{state.errors.confirm}</p>
          )}
        </div>

        {/* redirectTo, чтобы после регистрации попадать туда же, куда и после логина */}
        <input type="hidden" name="redirectTo" value={callbackUrl} />

        <Button
          className="h-10 px-4 mt-4 w-full text-shadow-lg/40 5 5"
          aria-disabled={isPending}
        >
          Зарегистрироваться
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>

        {/* Общие сообщения */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex h-8 items-end space-x-1"
        >
          {state?.message && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-600">{state.message}</p>
            </>
          )}
        </div>

        <p className="mt-2 text-center text-sm text-gray-600">
          Уже есть аккаунт?{" "}
          <a className="text-blue-600 underline" href="/login">
            Войти
          </a>
        </p>
      </div>
    </form>
  );
}
