import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const contractPath = join(currentDir, "..", "contracts", "data-exchange.contract.json");

export function readDataExchangeContract() {
  return JSON.parse(readFileSync(contractPath, "utf8"));
}
