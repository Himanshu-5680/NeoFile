import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

export function Menu({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="z-50 min-w-56 border-[3px] border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--ink)] shadow-[6px_6px_0_var(--shadow)]" sideOffset={6}>
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function MenuItem({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) {
  return (
    <Dropdown.Item
      className="cursor-pointer px-2 py-2 text-sm font-bold outline-none data-[highlighted]:bg-[var(--accent)] data-[highlighted]:text-[var(--accent-ink)]"
      onSelect={onSelect}
    >
      {children}
    </Dropdown.Item>
  );
}
