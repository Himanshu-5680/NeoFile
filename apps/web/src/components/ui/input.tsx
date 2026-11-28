import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border-2 border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none focus:bg-[var(--bg)]",
        className,
      )}
      {...props}
    />
  );
}
