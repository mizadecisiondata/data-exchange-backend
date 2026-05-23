import { getConfig } from "../src/config/env.mjs";
import { buildHealthResponse } from "../src/routes/health.mjs";

const config = getConfig();
const health = buildHealthResponse(config, new Date("2026-05-22T00:00:00.000Z"));

const expected = [
  health.status === "ok",
  health.service === "data-exchange-backend",
  health.phase === "2-auth-visual",
  health.rules.billingMode === "monthly_postpaid",
  health.rules.allowPrepaidPrimaryModel === false,
  health.rules.ingestionQualityThreshold === 0.95,
  health.rules.bacAppendOnly === true,
  health.rules.duplicatePolicy === "discard_without_error_or_credits",
  health.portals.devMonitor === "external_reserved"
];

if (expected.some((value) => value !== true)) {
  console.error(JSON.stringify(health, null, 2));
  throw new Error("Backend health contract failed.");
}

console.log("Backend health contract ok.");
