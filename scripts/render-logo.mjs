import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
const { Resvg } = await import("@resvg/resvg-js").catch(() => import("/tmp/node_modules/@resvg/resvg-js/index.js"));

const root = resolve(import.meta.dirname, "..");
const logo = readFileSync(resolve(root, "assets/logo.svg"));

function png(svg, size, file, background) {
  const image = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: background ?? "rgba(0,0,0,0)",
  });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, image.render().asPng());
}

png(logo, 1024, resolve(root, "assets/logo-1024.png"));
png(logo, 512, resolve(root, "assets/logo-512.png"));
png(logo, 64, resolve(root, "apps/web/public/favicon.png"));
writeFileSync(resolve(root, "apps/web/public/logo.svg"), logo);

const adaptive = readFileSync(resolve(root, "assets/logo-adaptive.svg"));
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const res = resolve(root, "apps/web/android/app/src/main/res");
for (const [name, scale] of Object.entries(densities)) {
  png(logo, Math.round(48 * scale), resolve(res, `mipmap-${name}/ic_launcher.png`));
  png(logo, Math.round(48 * scale), resolve(res, `mipmap-${name}/ic_launcher_round.png`));
  png(adaptive, Math.round(108 * scale), resolve(res, `mipmap-${name}/ic_launcher_foreground.png`));
}

const logoInner = readFileSync(resolve(root, "assets/logo.svg"), "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const splash = (w, h) => {
  const mark = Math.round(Math.min(w, h) * 0.46);
  const font = Math.round(mark * 0.16);
  const block = mark + font + Math.round(mark * 0.16);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#F3EDE2"/>
  <g transform="translate(${(w - mark) / 2} ${(h - block) / 2})">
    <svg width="${mark}" height="${mark}" viewBox="0 0 512 512">${logoInner}</svg>
    <text x="${mark / 2}" y="${mark + font}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="${font}" font-weight="700" fill="#141414">NEOFILE</text>
  </g>
</svg>`;
};

const splashes = {
  "drawable/splash.png": [480, 320],
  "drawable-port-mdpi/splash.png": [320, 480],
  "drawable-port-hdpi/splash.png": [480, 800],
  "drawable-port-xhdpi/splash.png": [720, 1280],
  "drawable-port-xxhdpi/splash.png": [960, 1600],
  "drawable-port-xxxhdpi/splash.png": [1280, 1920],
  "drawable-land-mdpi/splash.png": [480, 320],
  "drawable-land-hdpi/splash.png": [800, 480],
  "drawable-land-xhdpi/splash.png": [1280, 720],
  "drawable-land-xxhdpi/splash.png": [1600, 960],
  "drawable-land-xxxhdpi/splash.png": [1920, 1280],
};

for (const [rel, [w, h]] of Object.entries(splashes)) {
  const svg = splash(w, h);
  png(svg, w, resolve(root, "apps/web/android/app/src/main/res", rel));
}

const iosSplash = splash(2732, 2732);
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  png(iosSplash, 2732, resolve(root, "apps/web/ios/App/App/Assets.xcassets/Splash.imageset", name));
}

console.log("rendered logo and splashes");
