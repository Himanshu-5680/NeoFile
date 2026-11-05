import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border-[3px] border-[var(--line)] px-3 py-2 text-sm font-bold shadow-[4px_4px_0_var(--shadow)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        surface: "bg-[var(--surface)] text-[var(--ink)]",
        accent: "bg-[var(--accent)] text-[var(--accent-ink)]",
      },
      size: {
        sm: "px-2 py-1 text-xs shadow-[3px_3px_0_var(--shadow)]",
        md: "px-3 py-2",
      },
    },
    defaultVariants: { tone: "surface", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, tone, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ tone, size }), className)} {...props} />;
}
