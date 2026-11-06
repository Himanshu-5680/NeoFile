import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const bannedName = /(^|\/)([^/]*\.(keystore|jks|p12|pfx|pem)|id_rsa|.*\.keystore)$/i;
const binary = /\.(png|jpg|jpeg|gif|webp|avif|ico|icns|woff2|jar|zip|gz|pdf|wasm|icns)$/i;
const privateKey = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/;

const hits = [];
for (const file of files) {
  if (bannedName.test(file)) {
    hits.push(`${file}: keystore or private key file must not be committed`);
    continue;
  }
  if (binary.test(file)) continue;
  const buf = readFileSync(file);
  if (buf.includes(0)) continue;
  if (privateKey.test(buf.toString("utf8"))) {
    hits.push(`${file}: private key block must not be committed`);
  }
}

if (hits.length > 0) {
  console.error(hits.join("\n"));
  process.exit(1);
}

console.log(`Checked ${files.length} tracked files for keystores and private keys.`);
