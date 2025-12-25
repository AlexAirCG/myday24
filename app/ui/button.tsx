import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "flex items-center rounded bg-gradient-to-br from-blue-200 to-blue-600 border-gray-500 border-2 shadow-[0_4px_8px_rgba(0,0,0,0.5)] text-sm font-medium text-white transition-colors hover:from-blue-300 hover:to-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:from-blue-400 active:to-blue-800 active:shadow-inner active:translate-y-[1px] text-shadow-lg/40",
        className
      )}
    >
      {children}
    </button>
  );
}
