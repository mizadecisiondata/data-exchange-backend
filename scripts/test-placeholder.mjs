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
  approveClientDocument,
  approveDemoAccessRequest,
  createAdminClient,
  createAdminUser,
  createDemoSubUser,
  dispatchClientInvoice,
  getDemoState,
  getUsageResponse,
  ingestInformationBlocks,
  resetDemoState,
  runBatchQuery,
  runIndividualQuery,
  updateAdminSettings,
  updateAdminUser,
  uploadClientDocument,
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
const demoCreditQuery2 = runIndividualQuery({ product: "complete_report" });
const demoCreditQuery3 = runIndividualQuery({ product: "complete_report" });
const demoCreditQuery4 = runIndividualQuery({ product: "complete_report" });
const demoExcessQuery = runIndividualQuery({ product: "complete_report" });
const demoBatch = runBatchQuery();
const demoAdminClient = createAdminClient({
  legalName: "CLIENTE FANTASMA S.A.",
  sector: "Casa comercial",
  mode: "Cliente Normal",
  email: "operaciones@cliente-fantasma.demo"
});
const demoAdminClientApproval = approveDemoAccessRequest(demoAdminClient.client.requestId, {});
const demoAdminUser = createAdminUser({
  name: "Analista soporte",
  email: "soporte@decisiondata.ec",
  role: "Soporte",
  modules: ["dashboard", "clientes", "notificaciones"]
});
const demoAdminUserUpdate = updateAdminUser(demoAdminUser.user.id, { active: false });
const demoSettingsUpdate = updateAdminSettings({ devMonitorExternal: true, sbInhabilitationIncludedInPanorama: true });
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

if (demoQuery.audit.product !== "complete_report" || demoQuery.result.inhabilitations?.isInhabilitated !== false) {
  throw new Error("Complete report must include SB inhabilitation status as an indicator, not a separate product.");
}

if (demoQuery.audit.tariff !== "data_partner_founding_credit_tariff_1_to_1" || demoQuery.audit.estimatedValue !== 0.5 || demoQuery.audit.creditApplied !== true) {
  throw new Error("Founding complete report within credits must use the Founding tariff matrix.");
}

if (demoCreditQuery4.audit.tariff !== "data_partner_founding_credit_tariff_1_to_1" || demoExcessQuery.audit.tariff !== "cliente_normal_excess_tariff" || demoExcessQuery.audit.estimatedValue !== 1) {
  throw new Error("Founding credit exhaustion must move excess queries to Cliente Normal tariff.");
}

if (demoExcessQuery.state.invoicePreview.breakdown.dataPartnerCreditQueries !== 4 || demoExcessQuery.state.invoicePreview.breakdown.excessNormalQueries !== 1) {
  throw new Error("Invoice preview must split Data Partner credit queries from normal-tariff excess.");
}

if (demoBatch.batch.rowsProcessed !== 3 || demoUsage.invoicePreview.billingMode !== "monthly_postpaid") {
  throw new Error("Demo batch query and usage invoice preview must be functional.");
}

if (demoBatch.batch.completeReportRows !== 2 || demoBatch.batch.sebInhabilitatedRows !== 1) {
  throw new Error("Batch complete reports must surface SB inhabilitation status inside panorama processing.");
}

const adminState = getDemoState();

if (adminState.adminClients.length < 3 || demoAdminClientApproval.payload.productionAccess !== true) {
  throw new Error("Admin must be able to create a phantom client and approve its onboarding request.");
}

if (!adminState.globalUsage || !Array.isArray(adminState.globalUsage.series) || adminState.globalUsage.series.length === 0) {
  throw new Error("Admin dashboard must expose global usage series.");
}

if (adminState.ingestionDashboard.acceptedRows < 4 || adminState.auditLog.length === 0 || adminState.notifications.length === 0) {
  throw new Error("Admin ingestion, audit and notification dashboards must reflect client activity.");
}

if (demoAdminUserUpdate.payload.user.status !== "blocked") {
  throw new Error("Admin users module must support user status updates.");
}

if (demoSettingsUpdate.payload.settings.devMonitorExternal !== true) {
  throw new Error("Admin settings must support operational updates.");
}

if (!demoSubUser.subUser.allowedModules.includes("consulta-individual") || demoSubUserUpdate.payload.subUser.status !== "blocked") {
  throw new Error("Client superadmin must be able to create and restrict subusers.");
}

resetDemoState();
approveDemoAccessRequest("REQ-2026-MEGADATOS-DEMO", {});
ingestInformationBlocks({ currentSubjects: 5, historicalSubjects: 0 });
const demoBasicFree = runIndividualQuery({ product: "basic_report" });
const demoFoundingPanorama = runIndividualQuery({ product: "complete_report" });
const demoMassiveBatch = runBatchQuery({ product: "complete_report", recordCount: 1000 });
const demoInvoiceDispatch = dispatchClientInvoice("client_megadatos_demo", { channel: "provider_api" });
const demoDocumentUpload = uploadClientDocument({
  clientId: "client_megadatos_demo",
  documentId: "ruc",
  fileName: "ruc-megadatos-actualizado.pdf"
});
const demoDocumentApproval = approveClientDocument("client_megadatos_demo", "ruc", {});

if (demoBasicFree.audit.tariff !== "data_partner_basic_report_free_with_credit" || demoBasicFree.audit.estimatedValue !== 0 || demoBasicFree.audit.creditApplied !== true) {
  throw new Error("Data Partner Founding basic report must be free while Decision Credits are available.");
}

if (demoFoundingPanorama.audit.tariff !== "data_partner_founding_credit_tariff_1_to_1" || demoFoundingPanorama.audit.estimatedValue !== 0.5) {
  throw new Error("Data Partner Founding panorama must keep preferential tariff while credits are available.");
}

if (demoMassiveBatch.batch.isAggregated !== true || demoMassiveBatch.batch.rowsProcessed !== 1000 || demoMassiveBatch.batch.creditAppliedRows !== 3 || demoMassiveBatch.batch.excessRows !== 997) {
  throw new Error("Massive batch simulation must aggregate records and split Decision Credits from excess Cliente Normal tariff.");
}

if (!demoMassiveBatch.state.outbox.some((item) => item.type === "decision_credits_depleted")) {
  throw new Error("Clients must be notified when Decision Credits are depleted.");
}

if (demoInvoiceDispatch.dispatch.status !== "simulated_provider_api_queued" || demoInvoiceDispatch.state.auditLog[0].type !== "invoice_approved_and_dispatched") {
  throw new Error("Admin billing must support invoice approval and provider API dispatch simulation.");
}

if (demoDocumentUpload.payload.document.status !== "uploaded_for_review" || demoDocumentApproval.payload.document.status !== "approved") {
  throw new Error("Client documents must be uploadable and approvable by admin.");
}

resetDemoState();
approveDemoAccessRequest("REQ-2026-MEGADATOS-DEMO", {});
ingestInformationBlocks({ currentSubjects: 2000, historicalSubjects: 2000, historicalDepth: 28 });
runIndividualQuery({ product: "complete_report" });
const demoAllUnitsTierBatch = runBatchQuery({ product: "complete_report", recordCount: 1000 });

if (demoAllUnitsTierBatch.batch.creditAppliedRows !== 1000 || demoAllUnitsTierBatch.batch.excessRows !== 0) {
  throw new Error("All-units tier batch must consume available Data Partner credits before excess tariff.");
}

if (demoAllUnitsTierBatch.batch.tariffBreakdown.length !== 1 || demoAllUnitsTierBatch.batch.tariffBreakdown[0].tariffTier !== "1001-5000" || demoAllUnitsTierBatch.batch.tariffBreakdown[0].unitPrice !== 0.22 || demoAllUnitsTierBatch.batch.estimatedSubtotal !== 220) {
  throw new Error("Batch pricing must apply one all-units tier based on final monthly volume, not marginal ranges.");
}

console.log("Backend bootstrap tests ok.");
