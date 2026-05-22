import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

function readContractFile(fileName) {
  const contractPath = join(currentDir, "..", "contracts", fileName);
  return JSON.parse(readFileSync(contractPath, "utf8"));
}

export function readDataExchangeContract() {
  const contract = readContractFile("data-exchange.contract.json");
  return {
    ...contract,
    sourceContracts: {
      consent: readContractFile("consent.contract.json"),
      dataPartnerDictionary: readContractFile("data-partner-dictionary.contract.json"),
      pricing: readContractFile("pricing.contract.json")
    }
  };
}

export function readConsentContract() {
  return readContractFile("consent.contract.json");
}

export function readDataPartnerDictionaryContract() {
  return readContractFile("data-partner-dictionary.contract.json");
}

export function readPricingContract() {
  return readContractFile("pricing.contract.json");
}
