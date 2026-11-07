import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const webDeskBase = "/NeoFile/desk/";

function webDesk(base: string): Plugin {
  return {
    name: "neofile-web-desk",
    apply: "build",
    transformIndexHtml(html) {
      const head = [
        `<link rel="manifest" href="${base}manifest.webmanifest">`,
        `<link rel="apple-touch-icon" href="${base}icon-512.png">`,
        `<meta name="apple-mobile-web-app-capable" content="yes">`,
        `<meta name="apple-mobile-web-app-title" content="NeoFile web">`,
      ].join("");
      return html
        .replace("<title>NeoFile</title>", "<title>NeoFile web desk</title>")
        .replace("</head>", `${head}</head>`);
    },
    generateBundle(_options, bundle) {
      const files = [
        base,
        ...Object.keys(bundle)
          .filter((name) => !name.endsWith(".map"))
          .map((name) => `${base}${name}`),
        `${base}icon-512.png`,
        `${base}manifest.webmanifest`,
      ];
      const cache = `neofile-desk-${fnv(files.join("|"))}`;
      this.emitFile({
        type: "asset",
        fileName: "icon-512.png",
        source: readFileSync(path.resolve(__dirname, "../../assets/logo-512.png")),
      });
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: JSON.stringify({
          name: "NeoFile web desk",
          short_name: "NeoFile web",
          description: "Browser app. Not the native iOS or Android app.",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#f4efe6",
          theme_color: "#141414",
          icons: [{ src: `${base}icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" }],
        }),
      });
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: serviceWorker(cache, files, base),
      });
    },
  };
}

function fnv(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function serviceWorker(cache: string, files: string[], scope: string) {
  return `const CACHE=${JSON.stringify(cache)};
const FILES=${JSON.stringify(files)};
const SCOPE=${JSON.stringify(scope)};
self.addEventListener("install",(event)=>{
  event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",(event)=>{
  event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",(event)=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;
  event.respondWith(caches.match(event.request).then((hit)=>hit||fetch(event.request)));
});
`;
}

function productionCsp(): Plugin {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // frame-ancestors is ignored in a meta policy and Chrome reports it as an error.
    // The desktop shell sets that directive in tauri.conf.json, where it is enforced.
    "form-action 'none'",
    "connect-src ipc: http://ipc.localhost https://ipc.localhost",
    "img-src 'self' blob: data:",
    "media-src 'self' blob: data:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "worker-src 'self' blob:",
  ].join("; ");
  return {
    name: "neofile-csp",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
      return html.replace("</head>", `${meta}\n</head>`);
    },
  };
}

export default defineConfig(() => {
  const webDeskBuild = process.env.VITE_NEOFILE_PWA === "1";
  return {
  base: webDeskBuild ? webDeskBase : "/",
  plugins: [react(), tailwindcss(), productionCsp(), ...(webDeskBuild ? [webDesk(webDeskBase)] : [])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@neofile/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 47321,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 47321,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("pdfjs-dist")) return "pdf";
          if (id.includes("node_modules/xlsx")) return "xlsx";
          if (id.includes("@codemirror") || id.includes("@lezer")) return "editor";
          if (id.includes("mammoth") || id.includes("jszip")) return "docx";
        },
      },
    },
  },
  };
});
