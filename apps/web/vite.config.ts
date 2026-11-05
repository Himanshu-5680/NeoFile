import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function productionCsp(): Plugin {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
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

export default defineConfig({
  plugins: [react(), tailwindcss(), productionCsp()],
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
});
