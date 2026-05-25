import { getConfig } from "../src/config/env.mjs";
import {
  readConsentContract,
  readDataExchangeContract,
  readDataPartnerDictionaryContract,
  readOnboardingContract,
  readPricingContract
} from "../src/routes/contracts.mjs";
import {
  approveAccessRequestResponse,
  loginResponse,
  registerClientResponse
} from "../src/routes/auth.mjs";
import {
  approveDemoAccessRequest,
  createDemoSubUser,
  getDemoState,
  getUsageResponse,
  ingestInformationBlocks,
  resetDemoState,
  runBatchQuery,
  runIndividualQuery,
  updateDemoSubUser
} from "../src/routes/demo.mjs";
import { buildHealthResponse } from "../src/routes/health.mjs";

const health = buildHealthResponse(getConfig(), new Date("2026-05-22T00:00:00.000Z"));
const contract = readDataExchangeContract();
const consent = readConsentContract();
const dictionary = readDataPartnerDictionaryContract();
const onboarding = readOnboardingContract();
const pricing = readPricingContract();
const pendingLogin = loginResponse({ email: "operaciones@megadatos.demo", mode: "pending" });
const validRegistration = registerClientResponse({
  ruc: "0999999999001",
  legalName: "MEGADATOS S.A.",
  email: "miza@decisiondata.ec",
  sector: "Telco / ISP",
  mode: "Data Partner Founding"
});
const blockedApproval = approveAccessRequestResponse("REQ-2026-MEGADATOS-DEMO", { forcePricingChange: true });
resetDemoState();
const demoInitial = getDemoState();
const demoApproved = approveDemoAccessRequest("REQ-2026-MEGADATOS-DEMO", {});
const demoUpload = ingestInformationBlocks();
const demoQuery = runIndividualQuery({ product: "complete_report" });
const demoBatch = runBatchQuery();
const demoSubUser = createDemoSubUser({
  name: "Operador cobranza",
  email: "operador@megadatos.demo",
  role: "Operador cliente",
  allowedModules: ["inicio", "estado", "consulta-individual"]
});
const demoSubUserUpdate = updateDemoSubUser(demoSubUser.subUser.id, {
  active: false,
  allowedModules: ["inicio", "estado"]
});
const demoUsage = getUsageResponse();

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

if (!consent.strategicConsentCopy.body.includes("Decision Data")) {
  throw new Error("Consent contract must be adapted to Decision Data.");
}

if (dictionary.validationSummary.totalFields !== 57 || dictionary.quality.minimumAcceptedQuality !== 0.95) {
  throw new Error("Data Partner dictionary contract is not aligned with the source sheet.");
}

if (pricing.queryTariffMatrix.length !== 6 || pricing.billing.model !== "monthly_postpaid") {
  throw new Error("Pricing contract must preserve the commercial proposal matrix and postpaid model.");
}

if (!onboarding.adminReview.mergedLegacyAreas.includes("solicitudes") || onboarding.requiredDocumentChecklist.length < 8) {
  throw new Error("Onboarding contract must merge admin review and require habilitating documents.");
}

if (!pendingLogin.allowedModules.includes("carga_no_productiva") || pendingLogin.allowedModules.includes("api")) {
  throw new Error("Pending clients must only access non-productive onboarding modules.");
}

if (validRegistration.statusCode !== 202 || validRegistration.payload.productionAccess !== false) {
  throw new Error("Client registration must remain pending until admin review.");
}

if (blockedApproval.statusCode !== 409) {
  throw new Error("Pricing or commercial exceptions must block automated approval.");
}

if (demoInitial.client.productionAccess !== false || demoApproved.payload.productionAccess !== true) {
  throw new Error("Demo client must move from pending to approved through admin approval.");
}

if (demoUpload.upload.duplicateRows !== 1 || demoUpload.upload.errorRows !== 0 || demoUpload.upload.qualityScore < 0.95) {
  throw new Error("Demo ingestion must discard duplicates without counting them as errors.");
}

if (!demoQuery.audit.bac || !demoQuery.audit.consent || demoQuery.audit.status !== "completed") {
  throw new Error("Demo query must register BAC, consent and status.");
}

if (demoQuery.audit.tariff !== "data_partner_founding_lowest_tariff_12_months" || demoQuery.audit.estimatedValue !== 0.5) {
  throw new Error("Founding complete report must use the Founding tariff matrix, not Cliente Normal.");
}

if (demoBatch.batch.rowsProcessed !== 3 || demoUsage.invoicePreview.billingMode !== "monthly_postpaid") {
  throw new Error("Demo batch query and usage invoice preview must be functional.");
}

if (!demoSubUser.subUser.allowedModules.includes("consulta-individual") || demoSubUserUpdate.payload.subUser.status !== "blocked") {
  throw new Error("Client superadmin must be able to create and restrict subusers.");
}

console.log("Backend bootstrap tests ok.");
