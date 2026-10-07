import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv.slice(2).join(" ");
if (!password || password.length < 10 || password.length > 128) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("Password length must be between 10 and 128 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("base64url");
const derived = scryptSync(password.normalize("NFKC"), salt, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
console.log(`scrypt$32768$8$1$${salt}$${derived.toString("base64url")}`);
