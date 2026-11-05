import * as SwitchPrimitive from "@radix-ui/react-switch";

export function Switch({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold">
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-7 w-12 border-[3px] border-[var(--line)] bg-[var(--surface)] data-[state=checked]:bg-[var(--accent)]"
      >
        <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 bg-[var(--ink)] transition-transform data-[state=checked]:translate-x-5" />
      </SwitchPrimitive.Root>
      {label}
    </label>
  );
}
