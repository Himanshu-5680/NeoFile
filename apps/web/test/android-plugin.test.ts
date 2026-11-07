import { describe, expect, it } from "vitest";
import { holdPlugin } from "../src/platform/bridge";

describe("android plugin loader", () => {
  it("does not let an async function adopt the Capacitor plugin proxy", async () => {
    const calls: string[] = [];
    const plugin = {
      pendingShares: async () => ({ files: [] as const }),
      then(resolve: (value: unknown) => void) {
        calls.push("then");
        resolve("adopted-as-promise");
      },
    };
    const adopted = await (async () => plugin)();
    expect(adopted).toBe("adopted-as-promise");
    const boxed = await (async () => holdPlugin(plugin))();
    expect(boxed.plugin).toBe(plugin);
    expect(calls).toEqual(["then"]);
    expect(await boxed.plugin.pendingShares()).toEqual({ files: [] });
  });
});