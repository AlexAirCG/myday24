"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
import clsx from "clsx";

export function SubmitButton({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...rest}
      type="submit"
      aria-disabled={pending}
      className={clsx(
        className,
        pending
          ? "from-blue-400 to-blue-800 shadow-inner translate-y-[1px] cursor-wait"
          : ""
      )}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
