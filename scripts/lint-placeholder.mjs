import { existsSync } from "node:fs";

const requiredFiles = [
  "src/server.mjs",
  "src/config/env.mjs",
  "src/contracts/data-exchange.contract.json",
  "src/routes/contracts.mjs",
  "src/routes/health.mjs",
  ".env.example",
  "README.md"
];

const missing = requiredFiles.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  throw new Error(`Backend bootstrap missing files: ${missing.join(", ")}`);
}

console.log("Backend bootstrap lint placeholder ok.");
