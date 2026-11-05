export function fnv1a(input: string | Uint8Array): string {
  let hash = 0x811c9dc5;
  if (typeof input === "string") {
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= (code >> 8) & 0xff;
      hash = Math.imul(hash, 0x01000193);
    }
  } else {
    for (let i = 0; i < input.length; i++) {
      hash ^= input[i];
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function docIdentity(name: string, byteLength: number, head: Uint8Array): string {
  const slice = head.subarray(0, Math.min(head.length, 65536));
  return `${fnv1a(name.toLowerCase())}-${byteLength.toString(16)}-${fnv1a(slice)}`;
}

export function safeFileName(name: string, fallback = "untitled"): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const cleaned = base.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/^\.+/, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return fallback;
  return cleaned.slice(0, 180);
}

export function uid(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
