import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "nb-button inline-flex items-center justify-center gap-2 border-2 px-3 py-2 text-sm font-bold disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        surface: "nb-button-surface",
        accent: "nb-button-accent",
      },
      size: {
        sm: "px-2 py-1 text-xs",
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
