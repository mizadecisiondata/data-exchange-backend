import { getConfig } from "../src/config/env.mjs";
import { readDataExchangeContract } from "../src/routes/contracts.mjs";
import { buildHealthResponse } from "../src/routes/health.mjs";

const health = buildHealthResponse(getConfig(), new Date("2026-05-22T00:00:00.000Z"));
const contract = readDataExchangeContract();

if (!Object.hasOwn(health.rules, "queryIdentifierPolicy")) {
  throw new Error("Health response must expose query identifier guardrail.");
}

if (health.rules.queryIdentifierPolicy !== "cedula_ruc_or_codigo_sb") {
  throw new Error("Query identifier policy changed without approval.");
}

if (contract.billing.primaryModel !== "monthly_postpaid") {
  throw new Error("Billing contract must remain monthly postpaid.");
}

if (contract.ingestion.unit !== "information_blocks" || contract.ingestion.qualityThreshold !== 0.95) {
  throw new Error("Ingestion contract changed without approval.");
}

if (!contract.queries.auditRequired.includes("bac") || !contract.queries.auditRequired.includes("consent")) {
  throw new Error("Query audit contract must include BAC and consent.");
}

console.log("Backend bootstrap tests ok.");
