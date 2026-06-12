import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
