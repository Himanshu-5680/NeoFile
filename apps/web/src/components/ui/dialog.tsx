import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[min(80dvh,720px)] w-[min(640px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 overflow-auto border-[3px] border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-[8px_8px_0_var(--shadow)]">
          <DialogPrimitive.Title className="text-xl font-bold tracking-tight">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="mt-1 text-sm text-[var(--muted)]">{description}</DialogPrimitive.Description> : null}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
