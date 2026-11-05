import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const border = Math.max(8, Math.round(size * 0.06));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const edge = x < border || y < border || x >= size - border || y >= size - border;
      const nx = (x - size * 0.22) / (size * 0.56);
      const ny = (y - size * 0.18) / (size * 0.64);
      const stroke = 0.18;
      const letter = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1 && (nx < stroke || nx > 1 - stroke || Math.abs(nx - ny) < stroke * 0.72);
      const ink = edge || letter;
      const offset = row + 1 + x * 4;
      if (ink) {
        raw[offset] = 0x14;
        raw[offset + 1] = 0x14;
        raw[offset + 2] = 0x14;
      } else {
        raw[offset] = 0xff;
        raw[offset + 1] = 0x4d;
        raw[offset + 2] = 0x2e;
      }
      raw[offset + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  ["apps/desktop/app-icon.png", 1024],
  ["apps/web/public/favicon.png", 64],
];
for (const [file, size] of targets) {
  mkdirSync(file.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(file, png(size));
  console.log(file, size);
}
