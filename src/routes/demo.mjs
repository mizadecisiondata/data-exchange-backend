import { readPricingContract } from "./contracts.mjs";

const pricingContract = readPricingContract();

const nowIso = () => new Date().toISOString();

const initialDocuments = {
  nda: true,
  "master-agreement": true,
  "technical-annex": true,
  ruc: false,
  "legal-appointment": false,
  "legal-id": false,
  "data-source": false,
  contacts: false
};

const sampleInformationRows = [
  { identifierType: "cedula", identifier: "0923048581", holderName: "Cliente Demo 1", product: "Internet hogar", balance: 120.5, daysPastDue: 0, consent: true },
  { identifierType: "cedula", identifier: "0911111111", holderName: "Cliente Demo 2", product: "Internet pyme", balance: 85.1, daysPastDue: 5, consent: true },
  { identifierType: "ruc", identifier: "0999999999001", holderName: "Comercio Demo", product: "Servicio corporativo", balance: 450.0, daysPastDue: 0, consent: true },
  { identifierType: "codigo_sb", identifier: "SB-000234", holderName: "Titular SB Demo", product: "Plan mayorista", balance: 990.0, daysPastDue: 18, consent: true },
  { identifierType: "cedula", identifier: "0923048581", holderName: "Duplicado", product: "Internet hogar", balance: 120.5, daysPastDue: 0, consent: true }
];

const sampleBatchRows = [
  { identifierType: "cedula", identifier: "0923048581", product: "complete_report", channel: "batch" },
  { identifierType: "ruc", identifier: "0999999999001", product: "basic_report", channel: "batch" },
  { identifierType: "codigo_sb", identifier: "SB-000234", product: "complete_report", channel: "batch" }
];

const defaultSubUserModules = ["inicio", "estado", "carga", "consulta-individual", "consulta-bloque", "auditoria"];
const defaultAdminUsers = [
  {
    id: "admin_user_operaciones",
    name: "Operaciones Decision Data",
    email: "admin@decisiondata.ec",
    role: "Super admin",
    status: "active",
    modules: ["dashboard", "onboarding", "clientes", "usuarios", "ingesta", "consumos", "facturacion", "auditoria", "notificaciones", "configuracion"],
    createdAt: "2026-05-23T08:00:00.000Z"
  },
  {
    id: "admin_user_onboarding",
    name: "Analista onboarding",
    email: "onboarding@decisiondata.ec",
    role: "Onboarding",
    status: "active",
    modules: ["onboarding", "clientes", "notificaciones"],
    createdAt: "2026-05-23T08:05:00.000Z"
  }
];

const defaultSettings = {
  qualityThreshold: 0.95,
  billingMode: "monthly_postpaid",
  allowPricingAutomation: false,
  emailProvider: "simulated_outbox",
  devMonitorExternal: true,
  sbInhabilitationIncludedInPanorama: true
};

const decisionCreditPolicy = {
  maxHistoricalMonths: 48,
  currentPeriodCredits: 1,
  historicalSeriesTotalCredits: 4,
  monthlyBalanceDepreciationCredits: 1 / 12
};

const historicalCreditWeights = Array.from({ length: decisionCreditPolicy.maxHistoricalMonths }, (_, index) => {
  const monthAge = index + 1;
  return Math.log((decisionCreditPolicy.maxHistoricalMonths + 2) / (monthAge + 1));
});
const historicalCreditScale = decisionCreditPolicy.historicalSeriesTotalCredits
  / historicalCreditWeights.reduce((sum, value) => sum + value, 0);

function createState() {
  return {
    client: {
      id: "client_megadatos_demo",
      legalName: "MEGADATOS S.A.",
      sector: "Telco / ISP",
      mode: "Data Partner Founding",
      state: "documents_observed",
      productionAccess: false,
      sandboxUploadAllowed: true,
      creditsBalance: 0
    },
    documents: { ...initialDocuments },
    uploads: [],
    queries: [],
    batchQueries: [],
    phantomClients: [
      {
        id: "client_retail_demo",
        requestId: "REQ-2026-RETAIL-DEMO",
        legalName: "RETAIL DEMO S.A.",
        sector: "Retail",
        mode: "Data Partner Active",
        state: "pending_documents",
        productionAccess: false,
        sandboxUploadAllowed: true,
        creditsBalance: 0,
        documents: {
          nda: true,
          "master-agreement": false,
          "technical-annex": false,
          ruc: true,
          "legal-appointment": false,
          "legal-id": false,
          "data-source": false,
          contacts: true
        },
        uploads: [],
        queries: [],
        batchQueries: [],
        subUsers: [],
        usage: createUsageSummary(),
        outbox: [
          {
            id: "email_retail_pending",
            type: "registration_received",
            to: "operaciones@retail.demo",
            subject: "Solicitud recibida - Decision Data",
            status: "simulated_not_sent",
            createdAt: "2026-05-24T09:00:00.000Z"
          }
        ],
        createdAt: "2026-05-24T09:00:00.000Z"
      }
    ],
    adminUsers: defaultAdminUsers.map((user) => ({ ...user, modules: [...user.modules] })),
    settings: { ...defaultSettings },
    adminAudit: [],
    subUsers: [
      {
        id: "subuser_analista_demo",
        name: "Analista de riesgos demo",
        email: "analista@megadatos.demo",
        role: "Analista de consultas",
        status: "active",
        allowedModules: defaultSubUserModules,
        mustChangeTemporaryPassword: true,
        createdAt: "2026-05-23T08:10:00.000Z"
      }
    ],
    usage: createUsageSummary(),
    outbox: [
      {
        id: "email_welcome_pending",
        type: "registration_received",
        to: "operaciones@megadatos.demo",
        subject: "Solicitud recibida - Decision Data",
        status: "simulated_not_sent",
        createdAt: "2026-05-23T08:00:00.000Z"
      }
    ]
  };
}

let state = createState();

export function resetDemoState() {
  state = createState();
  return getDemoState();
}

export function getDemoState() {
  return {
    status: "ok",
    generatedAt: nowIso(),
    client: { ...state.client },
    documents: { ...state.documents },
    uploads: state.uploads.map((item) => ({ ...item })),
    queries: state.queries.map((item) => ({ ...item })),
    batchQueries: state.batchQueries.map((item) => ({ ...item })),
    subUsers: state.subUsers.map((item) => ({ ...item, allowedModules: [...item.allowedModules] })),
    usage: { ...state.usage },
    outbox: state.outbox.map((item) => ({ ...item })),
    accessRequest: buildAccessRequest(),
    invoicePreview: buildInvoicePreview(),
    adminClients: buildAdminClients(),
    adminUsers: state.adminUsers.map((item) => ({ ...item, modules: [...item.modules] })),
    globalUsage: buildGlobalUsage(),
    ingestionDashboard: buildIngestionDashboard(),
    auditLog: buildAuditLog(),
    notifications: buildNotifications(),
    settings: { ...state.settings }
  };
}

export function listDemoAccessRequests() {
  return {
    status: "ok",
    requests: buildAdminClients().map((client) => ({
      id: client.requestId,
      legalName: client.legalName,
      sector: client.sector,
      mode: client.mode,
      state: client.state,
      productionAccess: client.productionAccess,
      sandboxUploadAllowed: client.sandboxUploadAllowed,
      blockingDocumentsMissing: client.blockingDocumentsMissing
    }))
  };
}

export function observeDemoAccessRequest(id, body) {
  const target = findClientByRequestId(id);
  if (!target) {
    return {
      status: "not_found",
      requestId: id,
      observation: "Solicitud no encontrada.",
      notifyClient: false,
      emailSending: "not_sent"
    };
  }

  const event = {
    id: `email_observation_${Date.now()}`,
    type: "document_observation",
    to: getClientEmail(target),
    subject: "Observacion documental - Decision Data",
    status: "simulated_not_sent",
    body: body.observation ?? "Documentos habilitantes pendientes.",
    createdAt: nowIso()
  };
  pushClientOutbox(target, event);
  pushAdminAudit({
    type: "admin_onboarding_observation",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: event.body,
    channel: "admin",
    status: "registered"
  });

  return {
    status: "observation_registered",
    requestId: id,
    observation: event.body,
    notifyClient: true,
    emailSending: event.status,
    bac: {
      eventType: "admin_onboarding_observation",
      appendOnly: true
    }
  };
}

export function approveDemoAccessRequest(id, body) {
  if (body?.forcePricingChange === true || body?.commercialException === true) {
    return {
      statusCode: 409,
      payload: {
        status: "approval_blocked",
        reason: "commercial_or_pricing_decision_requires_mateo",
        requestId: id
      }
    };
  }

  const target = findClientByRequestId(id);
  if (!target) {
    return {
      statusCode: 404,
      payload: {
        status: "not_found",
        requestId: id
      }
    };
  }

  setClientDocuments(target, Object.fromEntries(Object.keys(target.documents).map((key) => [key, true])));
  target.client.state = "approved";
  target.client.productionAccess = true;
  target.client.sandboxUploadAllowed = true;
  const email = {
    id: `email_temp_credentials_${Date.now()}`,
    type: "temporary_credentials",
    to: getClientEmail(target),
    subject: "Acceso aprobado - credenciales temporales Decision Data",
    status: "simulated_not_sent",
    body: `Usuario temporal generado para ${target.client.legalName}. En produccion se enviara por proveedor transaccional.`,
    createdAt: nowIso()
  };
  pushClientOutbox(target, email);
  pushAdminAudit({
    type: "admin_access_approval",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: "Acceso productivo sandbox aprobado y credenciales temporales generadas.",
    channel: "admin",
    status: "approved"
  });

  return {
    statusCode: 202,
    payload: {
      status: "approved_sandbox",
      requestId: id,
      temporaryPasswordEmail: "simulated_not_sent",
      mustChangeTemporaryPassword: true,
      productionAccess: true,
      state: getDemoState(),
      bac: {
        eventType: "admin_access_approval",
        appendOnly: true
      }
    }
  };
}

export function buildTemplate(name) {
  if (name === "batch-query.csv") {
    return [
      "identifierType,identifier,product,channel,bac,consentReference",
      "cedula,0923048581,complete_report,batch,BAC-DEMO-001,CONS-DEMO-001",
      "ruc,0999999999001,basic_report,batch,BAC-DEMO-002,CONS-DEMO-002",
      "codigo_sb,SB-000234,complete_report,batch,BAC-DEMO-003,CONS-DEMO-003"
    ].join("\n");
  }

  return [
    "identifierType,identifier,holderName,product,balance,daysPastDue,cutoffDate,consentReference",
    "cedula,0923048581,Cliente Demo 1,Internet hogar,120.50,0,2026-05-23,CONS-DEMO-001",
    "cedula,0911111111,Cliente Demo 2,Internet pyme,85.10,5,2026-05-23,CONS-DEMO-002",
    "ruc,0999999999001,Comercio Demo,Servicio corporativo,450.00,0,2026-05-23,CONS-DEMO-003",
    "codigo_sb,SB-000234,Titular SB Demo,Plan mayorista,990.00,18,2026-05-23,CONS-DEMO-004"
  ].join("\n");
}

export function ingestInformationBlocks(body = {}) {
  const target = findClientById(body.clientId) ?? getPrimaryClientTarget();
  const rows = Array.isArray(body.rows) && body.rows.length > 0 ? body.rows : buildSimulatedInformationRows(body);
  const seen = new Set();
  const duplicates = [];
  const accepted = [];
  const errors = [];

  rows.forEach((row, index) => {
    const periodAgeMonths = normalizePeriodAgeMonths(row.periodAgeMonths ?? row.monthAge ?? row.period);
    const key = `${row.identifierType}:${row.identifier}:M-${periodAgeMonths}`;
    if (seen.has(key)) {
      duplicates.push({ index, identifier: row.identifier });
      return;
    }
    seen.add(key);

    if (!row.identifierType || !row.identifier || !row.holderName || row.consent !== true) {
      errors.push({ index, reason: "missing_required_field_or_consent" });
      return;
    }

    accepted.push({ ...row, periodAgeMonths });
  });

  const denominator = rows.length - duplicates.length;
  const qualityScore = denominator === 0 ? 0 : accepted.length / denominator;
  const status = qualityScore >= 0.95 ? "accepted" : "rejected_quality_below_95";
  const creditGeneration = status === "accepted" ? calculateUploadCredits(accepted, target.client.mode) : createEmptyCreditGeneration();
  const creditsGenerated = creditGeneration.totalCredits;
  const upload = {
    id: `UPL-${Date.now()}`,
    status,
    mode: target.client.productionAccess ? "productive_sandbox" : "non_productive_sandbox",
    clientId: target.client.id,
    clientName: target.client.legalName,
    rowsReceived: rows.length,
    acceptedRows: accepted.length,
    duplicateRows: duplicates.length,
    errorRows: errors.length,
    qualityScore,
    threshold: 0.95,
    duplicatesPolicy: "discarded_without_error_or_credits",
    creditsGenerated,
    currentCreditsGenerated: creditGeneration.currentCredits,
    historicalCreditsGenerated: creditGeneration.historicalCredits,
    creditGeneration,
    createdAt: nowIso()
  };

  target.uploads.unshift(upload);
  target.client.creditsBalance = roundCredits(target.client.creditsBalance + creditsGenerated);
  target.usage.creditsGenerated = roundCredits(target.usage.creditsGenerated + creditsGenerated);
  target.usage.currentCreditsGenerated = roundCredits(target.usage.currentCreditsGenerated + creditGeneration.currentCredits);
  target.usage.historicalCreditsGenerated = roundCredits(target.usage.historicalCreditsGenerated + creditGeneration.historicalCredits);
  pushAdminAudit({
    type: "client_information_block_upload",
    actor: body.user ?? "operaciones@megadatos.demo",
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: `${accepted.length} registros aceptados, ${duplicates.length} duplicados, calidad ${Math.round(qualityScore * 100)}%, ${creditsGenerated.toFixed(2)} Decision Credits generados.`,
    channel: target.client.productionAccess ? "portal" : "non_productive_portal",
    status
  });

  return {
    status: "ok",
    upload,
    duplicates,
    errors,
    state: getDemoState()
  };
}

function buildSimulatedInformationRows(body = {}) {
  const hasSimulationControls = ["currentSubjects", "historicalSubjects", "historicalDepth"]
    .some((key) => Object.hasOwn(body, key));

  if (!hasSimulationControls) {
    return sampleInformationRows.map((row) => ({ ...row, periodAgeMonths: 0 }));
  }

  const currentSubjects = Math.max(0, Math.min(200, Math.round(Number(body.currentSubjects ?? 0) || 0)));
  const historicalSubjects = Math.max(0, Math.min(50, Math.round(Number(body.historicalSubjects ?? 0) || 0)));
  const historicalDepth = Math.max(0, Math.min(48, Math.round(Number(body.historicalDepth ?? 48) || 0)));
  const rows = [];

  for (let index = 0; index < currentSubjects; index += 1) {
    rows.push({
      identifierType: "cedula",
      identifier: `09${String(23048581 + index).padStart(8, "0")}`,
      holderName: `Cliente vigente ${index + 1}`,
      product: "Informacion comercial vigente",
      balance: 100 + index,
      daysPastDue: index % 3,
      consent: true,
      periodAgeMonths: 0
    });
  }

  for (let subject = 0; subject < historicalSubjects; subject += 1) {
    for (let month = 1; month <= historicalDepth; month += 1) {
      rows.push({
        identifierType: "cedula",
        identifier: `17${String(10000000 + subject).padStart(8, "0")}`,
        holderName: `Cliente historico ${subject + 1}`,
        product: "Informacion comercial historica",
        balance: Math.max(0, 180 - month),
        daysPastDue: month % 6,
        consent: true,
        periodAgeMonths: month
      });
    }
  }

  return rows;
}

function calculateUploadCredits(rows, mode) {
  if (!mode.startsWith("Data Partner")) {
    return createEmptyCreditGeneration();
  }

  const result = rows.reduce((acc, row) => {
    const credit = getDecisionCreditForPeriod(row.periodAgeMonths);
    if (row.periodAgeMonths === 0) {
      acc.currentCredits += credit;
      acc.currentRows += 1;
    } else {
      acc.historicalCredits += credit;
      acc.historicalRows += 1;
    }
    acc.totalCredits += credit;
    return acc;
  }, createEmptyCreditGeneration());

  return {
    ...result,
    currentCredits: roundCredits(result.currentCredits),
    historicalCredits: roundCredits(result.historicalCredits),
    totalCredits: roundCredits(result.totalCredits)
  };
}

function createEmptyCreditGeneration() {
  return {
    currentRows: 0,
    historicalRows: 0,
    currentCredits: 0,
    historicalCredits: 0,
    totalCredits: 0,
    policy: "M0_1_credit_historical_M1_M48_logarithmic_total_4"
  };
}

function getDecisionCreditForPeriod(periodAgeMonths) {
  const monthAge = normalizePeriodAgeMonths(periodAgeMonths);
  if (monthAge === 0) {
    return decisionCreditPolicy.currentPeriodCredits;
  }
  return historicalCreditWeights[monthAge - 1] * historicalCreditScale;
}

function normalizePeriodAgeMonths(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase().replace("M", "").replace("-", "");
    const numeric = Number(normalized);
    return Math.max(0, Math.min(48, Math.round(Number.isFinite(numeric) ? numeric : 0)));
  }

  const numeric = Number(value);
  return Math.max(0, Math.min(48, Math.round(Number.isFinite(numeric) ? numeric : 0)));
}

export function runIndividualQuery(body = {}) {
  const target = findClientById(body.clientId) ?? getPrimaryClientTarget();
  const product = normalizeProduct(body.product);
  const channel = body.channel ?? "portal";
  const tariff = calculateTariff(product, target);
  const event = buildQueryEvent({
    identifierType: body.identifierType ?? "cedula",
    identifier: body.identifier ?? "0923048581",
    product,
    channel,
    user: body.user ?? getClientEmail(target),
    ip: body.ip ?? "127.0.0.1",
    tariff
  });

  applyQueryUsage(event, target);
  target.queries.unshift(event);
  pushAdminAudit({
    type: "client_query",
    actor: event.user,
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: `${event.product} ${event.identifierType}:${event.identifier} ${event.tariff} $${event.estimatedValue.toFixed(2)}`,
    channel: event.channel,
    status: event.status
  });

  return {
    status: "ok",
    result: buildReportResult(event),
    audit: event,
    state: getDemoState()
  };
}

export function runBatchQuery(body = {}) {
  const target = findClientById(body.clientId) ?? getPrimaryClientTarget();
  const requestedRecordCount = Math.max(0, Math.min(5_000_000, Math.round(Number(body.recordCount ?? 0) || 0)));
  if (!Array.isArray(body.rows) && requestedRecordCount > sampleBatchRows.length) {
    return runAggregatedBatchQuery({ body, target, recordCount: requestedRecordCount });
  }

  const rows = Array.isArray(body.rows) && body.rows.length > 0 ? body.rows : sampleBatchRows;
  const selectedProduct = body.product ? normalizeProduct(body.product) : null;
  const events = rows.map((row) => {
    const product = selectedProduct ?? normalizeProduct(row.product);
    const tariff = calculateTariff(product, target);
    const event = buildQueryEvent({
      identifierType: row.identifierType,
      identifier: row.identifier,
      product,
      channel: "batch",
      user: body.user ?? getClientEmail(target),
      ip: body.ip ?? "127.0.0.1",
      tariff
    });
    applyQueryUsage(event, target);
    return event;
  });

  const batch = {
    id: `BATCH-${Date.now()}`,
    status: "processed",
    rowsReceived: rows.length,
    rowsProcessed: events.length,
    completeReportRows: events.filter((event) => event.product === "complete_report").length,
    sebInhabilitatedRows: events.filter((event) => event.product === "complete_report" && event.inhabilitations?.isInhabilitated === true).length,
    estimatedSubtotal: roundMoney(events.reduce((sum, event) => sum + event.estimatedValue, 0)),
    createdAt: nowIso()
  };

  target.batchQueries.unshift(batch);
  target.queries.unshift(...events);
  pushAdminAudit({
    type: "client_batch_query",
    actor: body.user ?? "operaciones@megadatos.demo",
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: `${events.length} filas procesadas, ${batch.sebInhabilitatedRows} inhabilitadas SB, subtotal $${batch.estimatedSubtotal.toFixed(2)}.`,
    channel: "batch",
    status: "processed"
  });

  return {
    status: "ok",
    batch,
    results: events.map(buildReportResult),
    audits: events,
    state: getDemoState()
  };
}

function runAggregatedBatchQuery({ body, target, recordCount }) {
  const product = normalizeProduct(body.product);
  const channel = "batch";
  const { subtotal, breakdown, creditRows, excessRows, normalRows } = calculateAggregatedQueryBilling({
    product,
    target,
    recordCount
  });
  applyAggregatedUsage({ product, channel, target, recordCount, subtotal, breakdown, creditRows, excessRows, normalRows });

  const batch = {
    id: `BATCH-${Date.now()}`,
    status: "processed_aggregated",
    isAggregated: true,
    rowsReceived: recordCount,
    rowsProcessed: recordCount,
    completeReportRows: product === "complete_report" ? recordCount : 0,
    sebInhabilitatedRows: product === "complete_report" ? Math.min(recordCount, Math.round(recordCount * 0.02)) : 0,
    creditAppliedRows: creditRows,
    excessRows,
    normalRows,
    estimatedSubtotal: roundMoney(subtotal),
    tariffBreakdown: breakdown,
    createdAt: nowIso()
  };

  target.batchQueries.unshift(batch);
  pushAdminAudit({
    type: "client_batch_query_aggregated",
    actor: body.user ?? getClientEmail(target),
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: `${recordCount.toLocaleString("en-US")} filas simuladas, ${creditRows} con Decision Credits, ${excessRows + normalRows} a tarifa normal/exceso, subtotal $${batch.estimatedSubtotal.toFixed(2)}.`,
    channel,
    product,
    estimatedValue: batch.estimatedSubtotal,
    status: "processed"
  });

  return {
    status: "ok",
    batch,
    results: [],
    audits: [],
    state: getDemoState()
  };
}

function calculateAggregatedQueryBilling({ product, target, recordCount }) {
  const mode = target.client.mode;
  const creditPolicy = getDecisionCreditPolicy(mode, product);
  let balance = target.client.creditsBalance;
  let processed = 0;
  let subtotal = 0;
  let creditRows = 0;
  let excessRows = 0;
  let normalRows = 0;
  const breakdown = [];

  while (processed < recordCount) {
    const nextMonthlyVolume = target.usage.basicReports + target.usage.completeReports + processed + 1;
    const tier = findPricingTier(nextMonthlyVolume);
    const tierSlots = getTierRemainingSlots(tier, nextMonthlyVolume);
    const rowsInTier = Math.min(recordCount - processed, tierSlots);
    const possibleCreditRows = creditPolicy.creditCost > 0
      ? Math.min(rowsInTier, Math.floor(balance / creditPolicy.creditCost))
      : 0;

    if (possibleCreditRows > 0) {
      const tariff = resolveTariff({ mode, product, tier, usesCredit: true });
      const lineSubtotal = roundMoney(tariff.estimatedValue * possibleCreditRows);
      breakdown.push({
        bucket: tariff.bucket,
        tariff: tariff.rule,
        tariffLabel: tariff.label,
        tariffTier: tariff.tier,
        unitPrice: tariff.unitPrice,
        rows: possibleCreditRows,
        subtotal: lineSubtotal
      });
      balance = roundCredits(balance - possibleCreditRows * creditPolicy.creditCost);
      subtotal = roundMoney(subtotal + lineSubtotal);
      creditRows += possibleCreditRows;
    }

    const rowsWithoutCredit = rowsInTier - possibleCreditRows;
    if (rowsWithoutCredit > 0) {
      const tariff = resolveTariff({ mode, product, tier, usesCredit: false });
      const lineSubtotal = roundMoney(tariff.estimatedValue * rowsWithoutCredit);
      breakdown.push({
        bucket: tariff.bucket,
        tariff: tariff.rule,
        tariffLabel: tariff.label,
        tariffTier: tariff.tier,
        unitPrice: tariff.unitPrice,
        rows: rowsWithoutCredit,
        subtotal: lineSubtotal
      });
      subtotal = roundMoney(subtotal + lineSubtotal);
      if (tariff.bucket === "excess_cliente_normal") {
        excessRows += rowsWithoutCredit;
      } else {
        normalRows += rowsWithoutCredit;
      }
    }

    processed += rowsInTier;
  }

  return {
    subtotal: roundMoney(subtotal),
    breakdown: mergeTariffBreakdown(breakdown),
    creditRows,
    excessRows,
    normalRows
  };
}

function getTierRemainingSlots(tier, nextMonthlyVolume) {
  if (tier.monthlyVolume.endsWith("+")) {
    return Number.MAX_SAFE_INTEGER;
  }
  const [, maxRaw] = tier.monthlyVolume.split("-");
  return Math.max(1, Number(maxRaw) - nextMonthlyVolume + 1);
}

function mergeTariffBreakdown(items) {
  const grouped = new Map();
  items.forEach((item) => {
    const key = `${item.bucket}:${item.tariff}:${item.tariffTier}:${item.unitPrice}`;
    const current = grouped.get(key) ?? { ...item, rows: 0, subtotal: 0 };
    current.rows += item.rows;
    current.subtotal = roundMoney(current.subtotal + item.subtotal);
    grouped.set(key, current);
  });
  return [...grouped.values()];
}

function applyAggregatedUsage({ product, channel, target, recordCount, subtotal, breakdown, creditRows, excessRows, normalRows }) {
  if (product === "basic_report") {
    target.usage.basicReports += recordCount;
  } else {
    target.usage.completeReports += recordCount;
  }
  if (channel === "api") {
    target.usage.apiCalls += recordCount;
  }

  const creditPolicy = getDecisionCreditPolicy(target.client.mode, product);
  const creditsToUse = roundCredits(creditRows * creditPolicy.creditCost);
  const previousBalance = target.client.creditsBalance;
  target.client.creditsBalance = roundCredits(Math.max(0, target.client.creditsBalance - creditsToUse));
  target.usage.creditsUsed = roundCredits(target.usage.creditsUsed + creditsToUse);
  target.usage.estimatedSubtotal = roundMoney(target.usage.estimatedSubtotal + subtotal);
  target.usage.dataPartnerCreditQueries += creditRows;
  target.usage.dataPartnerCreditSubtotal = roundMoney(target.usage.dataPartnerCreditSubtotal + sumBreakdown(breakdown, "data_partner_credit"));
  target.usage.excessNormalQueries += excessRows;
  target.usage.excessNormalSubtotal = roundMoney(target.usage.excessNormalSubtotal + sumBreakdown(breakdown, "excess_cliente_normal"));
  target.usage.clienteNormalQueries += normalRows;
  target.usage.clienteNormalSubtotal = roundMoney(target.usage.clienteNormalSubtotal + sumBreakdown(breakdown, "cliente_normal"));
  maybeNotifyCreditBalance(target, previousBalance);
}

function sumBreakdown(breakdown, bucket) {
  return breakdown
    .filter((item) => item.bucket === bucket)
    .reduce((sum, item) => roundMoney(sum + item.subtotal), 0);
}

export function getUsageResponse() {
  return {
    status: "ok",
    usage: state.usage,
    creditsBalance: state.client.creditsBalance,
    invoicePreview: buildInvoicePreview(),
    outbox: state.outbox,
    queries: state.queries.slice(0, 10)
  };
}

export function dispatchClientInvoice(clientId, body = {}) {
  const target = findClientById(clientId) ?? getPrimaryClientTarget();
  const channel = body.channel === "provider_api" ? "provider_api" : "email";
  const invoice = buildInvoicePreviewFor(target.usage, target.client.creditsBalance);
  const dispatch = {
    id: `INV-DISPATCH-${Date.now()}`,
    type: channel === "provider_api" ? "invoice_provider_api_dispatch" : "invoice_email_dispatch",
    to: channel === "provider_api" ? "proveedor-sri-masivo@api.demo" : getClientEmail(target),
    subject: `Factura postpago Decision Data ${invoice.period} - ${target.client.legalName}`,
    status: channel === "provider_api" ? "simulated_provider_api_queued" : "simulated_not_sent",
    body: `Subtotal $${invoice.subtotal.toFixed(2)}, IVA $${invoice.tax.toFixed(2)}, total $${invoice.total.toFixed(2)}. Saldo Decision Credits ${invoice.creditsBalance}.`,
    createdAt: nowIso()
  };

  pushClientOutbox(target, dispatch);
  pushAdminAudit({
    type: "invoice_approved_and_dispatched",
    actor: body.actor ?? "facturacion@decisiondata.ec",
    clientId: target.client.id,
    clientName: target.client.legalName,
    detail: `${dispatch.subject} via ${channel}. ${dispatch.body}`,
    channel: "admin",
    estimatedValue: invoice.total,
    status: dispatch.status
  });

  return {
    status: "invoice_dispatched",
    dispatch,
    invoice,
    state: getDemoState()
  };
}

export function createAdminClient(body = {}) {
  const index = state.phantomClients.length + 2;
  const legalName = body.legalName ?? `CLIENTE FANTASMA ${index} S.A.`;
  const id = `client_${slugify(legalName)}_${Date.now()}`;
  const requestId = `REQ-2026-${slugify(legalName).toUpperCase().slice(0, 18)}-${Date.now().toString().slice(-4)}`;
  const client = {
    id,
    requestId,
    legalName,
    sector: body.sector ?? "Casa comercial",
    mode: body.mode ?? "Cliente Normal",
    state: "pending_documents",
    productionAccess: false,
    sandboxUploadAllowed: true,
    creditsBalance: 0,
    documents: {
      nda: false,
      "master-agreement": false,
      "technical-annex": false,
      ruc: true,
      "legal-appointment": false,
      "legal-id": false,
      "data-source": false,
      contacts: true
    },
    uploads: [],
    queries: [],
    batchQueries: [],
    subUsers: [],
    usage: createUsageSummary(),
    outbox: [
      {
        id: `email_${id}_received`,
        type: "registration_received",
        to: body.email ?? `operaciones@${slugify(legalName)}.demo`,
        subject: "Solicitud recibida - Decision Data",
        status: "simulated_not_sent",
        createdAt: nowIso()
      }
    ],
    createdAt: nowIso()
  };

  state.phantomClients.unshift(client);
  pushAdminAudit({
    type: "admin_client_created",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: client.id,
    clientName: client.legalName,
    detail: "Cliente fantasma creado para probar el flujo end-to-end.",
    channel: "admin",
    status: "created"
  });

  return {
    status: "client_created",
    client: buildClientRecord({ client, documents: client.documents, uploads: client.uploads, queries: client.queries, batchQueries: client.batchQueries, usage: client.usage, outbox: client.outbox }),
    state: getDemoState()
  };
}

export function createAdminUser(body = {}) {
  const user = {
    id: `admin_user_${Date.now()}`,
    name: body.name ?? "Nuevo usuario admin",
    email: body.email ?? `admin.${state.adminUsers.length + 1}@decisiondata.ec`,
    role: body.role ?? "Soporte",
    status: "active",
    modules: normalizeAdminModules(body.modules),
    createdAt: nowIso()
  };

  state.adminUsers.unshift(user);
  pushAdminAudit({
    type: "admin_user_created",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: "decision_data",
    clientName: "Decision Data",
    detail: `Usuario admin creado: ${user.email}`,
    channel: "admin",
    status: "created"
  });

  return {
    status: "admin_user_created",
    user: { ...user, modules: [...user.modules] },
    state: getDemoState()
  };
}

export function updateAdminUser(id, body = {}) {
  const user = state.adminUsers.find((item) => item.id === id);
  if (!user) {
    return {
      statusCode: 404,
      payload: {
        status: "not_found",
        userId: id
      }
    };
  }

  if (body.role) {
    user.role = body.role;
  }
  if (Array.isArray(body.modules)) {
    user.modules = normalizeAdminModules(body.modules);
  }
  if (typeof body.active === "boolean") {
    user.status = body.active ? "active" : "blocked";
  }

  pushAdminAudit({
    type: "admin_user_updated",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: "decision_data",
    clientName: "Decision Data",
    detail: `Usuario admin actualizado: ${user.email}`,
    channel: "admin",
    status: "updated"
  });

  return {
    statusCode: 200,
    payload: {
      status: "admin_user_updated",
      user: { ...user, modules: [...user.modules] },
      state: getDemoState()
    }
  };
}

export function updateAdminSettings(body = {}) {
  const blockedKeys = ["billingMode", "qualityThreshold"];
  const requestedBlocked = Object.keys(body).filter((key) => blockedKeys.includes(key));
  if (requestedBlocked.length > 0) {
    return {
      statusCode: 409,
      payload: {
        status: "settings_blocked",
        reason: "pricing_or_regulatory_setting_requires_mateo",
        blockedKeys: requestedBlocked
      }
    };
  }

  state.settings = {
    ...state.settings,
    allowPricingAutomation: Boolean(body.allowPricingAutomation ?? state.settings.allowPricingAutomation),
    emailProvider: body.emailProvider ?? state.settings.emailProvider,
    devMonitorExternal: Boolean(body.devMonitorExternal ?? state.settings.devMonitorExternal),
    sbInhabilitationIncludedInPanorama: Boolean(body.sbInhabilitationIncludedInPanorama ?? state.settings.sbInhabilitationIncludedInPanorama)
  };
  pushAdminAudit({
    type: "admin_settings_updated",
    actor: body.actor ?? "admin@decisiondata.ec",
    clientId: "decision_data",
    clientName: "Decision Data",
    detail: "Configuracion operativa actualizada en sandbox.",
    channel: "admin",
    status: "updated"
  });

  return {
    statusCode: 200,
    payload: {
      status: "settings_updated",
      settings: { ...state.settings },
      state: getDemoState()
    }
  };
}

export function createDemoSubUser(body = {}) {
  const target = findClientById(body.clientId) ?? getPrimaryClientTarget();
  const subUser = {
    id: `subuser_${Date.now()}`,
    name: body.name ?? "Nuevo subusuario",
    email: body.email ?? `subusuario.${target.subUsers.length + 1}@${slugify(target.client.legalName)}.demo`,
    role: body.role ?? "Operador cliente",
    status: "active",
    allowedModules: normalizeModules(body.allowedModules),
    mustChangeTemporaryPassword: true,
    createdAt: nowIso()
  };

  target.subUsers.unshift(subUser);
  pushClientOutbox(target, {
    id: `email_subuser_${Date.now()}`,
    type: "subuser_temporary_credentials",
    to: subUser.email,
    subject: "Acceso subusuario Decision Data",
    status: "simulated_not_sent",
    body: "Credenciales temporales de subusuario generadas en sandbox.",
    createdAt: nowIso()
  });

  return {
    status: "subuser_created",
    subUser: cloneSubUser(subUser),
    state: getDemoState()
  };
}

export function updateDemoSubUser(id, body = {}) {
  const target = findClientById(body.clientId) ?? getPrimaryClientTarget();
  const subUser = target.subUsers.find((item) => item.id === id);
  if (!subUser) {
    return {
      statusCode: 404,
      payload: {
        status: "not_found",
        subUserId: id
      }
    };
  }

  if (Array.isArray(body.allowedModules)) {
    subUser.allowedModules = normalizeModules(body.allowedModules);
  }
  if (typeof body.active === "boolean") {
    subUser.status = body.active ? "active" : "blocked";
  }
  if (body.role) {
    subUser.role = body.role;
  }

  return {
    statusCode: 200,
    payload: {
      status: "subuser_updated",
      subUser: cloneSubUser(subUser),
      state: getDemoState()
    }
  };
}

function buildAccessRequest() {
  const missing = Object.entries(state.documents)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  return {
    id: "REQ-2026-MEGADATOS-DEMO",
    legalName: state.client.legalName,
    sector: state.client.sector,
    mode: state.client.mode,
    state: state.client.state,
    productionAccess: state.client.productionAccess,
    sandboxUploadAllowed: state.client.sandboxUploadAllowed,
    blockingDocumentsMissing: missing
  };
}

function createUsageSummary() {
  return {
    basicReports: 0,
    completeReports: 0,
    apiCalls: 0,
    estimatedSubtotal: 0,
    creditsGenerated: 0,
    currentCreditsGenerated: 0,
    historicalCreditsGenerated: 0,
    creditsUsed: 0,
    creditsDepreciated: 0,
    dataPartnerCreditQueries: 0,
    dataPartnerCreditSubtotal: 0,
    excessNormalQueries: 0,
    excessNormalSubtotal: 0,
    clienteNormalQueries: 0,
    clienteNormalSubtotal: 0
  };
}

function buildAdminClients() {
  const primary = buildClientRecord({
    client: state.client,
    requestId: "REQ-2026-MEGADATOS-DEMO",
    documents: state.documents,
    uploads: state.uploads,
    queries: state.queries,
    batchQueries: state.batchQueries,
    usage: state.usage,
    outbox: state.outbox,
    createdAt: "2026-05-23T08:00:00.000Z"
  });

  return [
    primary,
    ...state.phantomClients.map((client) => buildClientRecord({
      client,
      requestId: client.requestId,
      documents: client.documents,
      uploads: client.uploads,
      queries: client.queries,
      batchQueries: client.batchQueries,
      usage: client.usage,
      outbox: client.outbox,
      createdAt: client.createdAt
    }))
  ];
}

function buildClientRecord({ client, requestId, documents, uploads, queries, batchQueries, usage, outbox, createdAt }) {
  const missing = Object.entries(documents)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const latestUpload = uploads[0];
  const latestQuery = queries[0];

  return {
    id: client.id,
    requestId: requestId ?? client.requestId,
    legalName: client.legalName,
    sector: client.sector,
    mode: client.mode,
    state: client.state,
    productionAccess: client.productionAccess,
    sandboxUploadAllowed: client.sandboxUploadAllowed,
    creditsBalance: client.creditsBalance,
    blockingDocumentsMissing: missing,
    documents: { ...documents },
    uploads: uploads.map((item) => ({ ...item })),
    queries: queries.map((item) => ({ ...item })),
    batchQueries: batchQueries.map((item) => ({ ...item })),
    usage: { ...usage },
    subUsers: (client.subUsers ?? state.subUsers ?? []).map((item) => ({ ...item, allowedModules: [...(item.allowedModules ?? [])] })),
    outbox: outbox.map((item) => ({ ...item })),
    invoicePreview: buildInvoicePreviewFor(usage, client.creditsBalance),
    createdAt,
    latestUploadAt: latestUpload?.createdAt ?? null,
    latestQueryAt: latestQuery?.createdAt ?? null,
    statusLabel: client.productionAccess ? "Aprobado" : missing.length > 0 ? "Revision documental" : "Listo para aprobar"
  };
}

function buildGlobalUsage() {
  const clients = buildAdminClients();
  const totals = clients.reduce((acc, client) => ({
    basicReports: acc.basicReports + client.usage.basicReports,
    completeReports: acc.completeReports + client.usage.completeReports,
    apiCalls: acc.apiCalls + client.usage.apiCalls,
    estimatedSubtotal: roundMoney(acc.estimatedSubtotal + client.usage.estimatedSubtotal),
    creditsGenerated: roundCredits(acc.creditsGenerated + client.usage.creditsGenerated),
    currentCreditsGenerated: roundCredits(acc.currentCreditsGenerated + client.usage.currentCreditsGenerated),
    historicalCreditsGenerated: roundCredits(acc.historicalCreditsGenerated + client.usage.historicalCreditsGenerated),
    creditsUsed: roundCredits(acc.creditsUsed + client.usage.creditsUsed),
    creditsDepreciated: roundCredits(acc.creditsDepreciated + client.usage.creditsDepreciated),
    productiveClients: acc.productiveClients + (client.productionAccess ? 1 : 0),
    pendingClients: acc.pendingClients + (client.productionAccess ? 0 : 1)
  }), {
    basicReports: 0,
    completeReports: 0,
    apiCalls: 0,
    estimatedSubtotal: 0,
    creditsGenerated: 0,
    currentCreditsGenerated: 0,
    historicalCreditsGenerated: 0,
    creditsUsed: 0,
    creditsDepreciated: 0,
    productiveClients: 0,
    pendingClients: 0
  });
  const currentQueries = totals.basicReports + totals.completeReports;

  return {
    ...totals,
    totalQueries: currentQueries,
    series: [
      { label: "Ene", queries: 44, amount: 34 },
      { label: "Feb", queries: 58, amount: 43 },
      { label: "Mar", queries: 69, amount: 51 },
      { label: "Abr", queries: 62, amount: 47 },
      { label: "May", queries: Math.max(currentQueries, 1), amount: Math.max(totals.estimatedSubtotal, 1) }
    ],
    productMix: [
      { label: "Basicos", count: totals.basicReports },
      { label: "Panorama", count: totals.completeReports },
      { label: "API", count: totals.apiCalls }
    ],
    byClient: clients.map((client) => ({
      clientId: client.id,
      legalName: client.legalName,
      queries: client.usage.basicReports + client.usage.completeReports,
      uploads: client.uploads.length,
      subtotal: client.usage.estimatedSubtotal,
      state: client.state
    }))
  };
}

function buildIngestionDashboard() {
  const clients = buildAdminClients();
  const uploads = clients.flatMap((client) => client.uploads.map((upload) => ({
    ...upload,
    clientId: client.id,
    clientName: client.legalName
  })));
  const acceptedRows = uploads.reduce((sum, upload) => sum + upload.acceptedRows, 0);
  const duplicateRows = uploads.reduce((sum, upload) => sum + upload.duplicateRows, 0);
  const errorRows = uploads.reduce((sum, upload) => sum + upload.errorRows, 0);

  return {
    uploads,
    acceptedRows,
    duplicateRows,
    errorRows,
    qualityThreshold: state.settings.qualityThreshold,
    byClient: clients.map((client) => ({
      clientId: client.id,
      legalName: client.legalName,
      uploads: client.uploads.length,
      acceptedRows: client.uploads.reduce((sum, upload) => sum + upload.acceptedRows, 0),
      creditsGenerated: client.uploads.reduce((sum, upload) => sum + upload.creditsGenerated, 0)
    }))
  };
}

function buildAuditLog() {
  const queryAudits = buildAdminClients().flatMap((client) => client.queries.map((query) => ({
    id: query.id,
    type: "query_bac",
    actor: query.user,
    clientId: client.id,
    clientName: client.legalName,
    channel: query.channel,
    product: query.product,
    tariff: query.tariff,
    estimatedValue: query.estimatedValue,
    status: query.status,
    detail: `${query.identifierType}:${query.identifier}`,
    createdAt: query.createdAt
  })));

  return [...state.adminAudit, ...queryAudits]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 60);
}

function buildNotifications() {
  return buildAdminClients()
    .flatMap((client) => client.outbox.map((email) => ({
      ...email,
      clientId: client.id,
      clientName: client.legalName
    })))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function findClientByRequestId(requestId) {
  if (requestId === "REQ-2026-MEGADATOS-DEMO") {
    return getPrimaryClientTarget();
  }

  const client = state.phantomClients.find((item) => item.requestId === requestId);
  if (!client) {
    return null;
  }
  return {
    client,
    documents: client.documents,
    uploads: client.uploads,
    queries: client.queries,
    batchQueries: client.batchQueries,
    subUsers: client.subUsers,
    usage: client.usage,
    outbox: client.outbox
  };
}

function findClientById(clientId) {
  if (!clientId || clientId === state.client.id) {
    return getPrimaryClientTarget();
  }
  const client = state.phantomClients.find((item) => item.id === clientId);
  if (!client) {
    return null;
  }
  return {
    client,
    documents: client.documents,
    uploads: client.uploads,
    queries: client.queries,
    batchQueries: client.batchQueries,
    subUsers: client.subUsers,
    usage: client.usage,
    outbox: client.outbox
  };
}

function getPrimaryClientTarget() {
  return {
    client: state.client,
    documents: state.documents,
    uploads: state.uploads,
    queries: state.queries,
    batchQueries: state.batchQueries,
    subUsers: state.subUsers,
    usage: state.usage,
    outbox: state.outbox
  };
}

function setClientDocuments(target, documents) {
  if (target.client.id === state.client.id) {
    state.documents = documents;
    target.documents = state.documents;
    return;
  }
  target.client.documents = documents;
  target.documents = target.client.documents;
}

function pushClientOutbox(target, email) {
  if (target.client.id === state.client.id) {
    state.outbox.unshift(email);
    return;
  }
  target.client.outbox.unshift(email);
}

function maybeNotifyCreditBalance(target, previousBalance = target.client.creditsBalance) {
  const currentBalance = roundCredits(target.client.creditsBalance);
  const hasDepletedNotice = target.outbox.some((item) => item.type === "decision_credits_depleted");
  const hasLowNotice = target.outbox.some((item) => item.type === "decision_credits_low");

  if (previousBalance > 0 && currentBalance <= 0 && !hasDepletedNotice) {
    pushClientOutbox(target, {
      id: `email_credits_depleted_${Date.now()}`,
      type: "decision_credits_depleted",
      to: getClientEmail(target),
      subject: "Decision Credits agotados - aplica tarifa Cliente Normal",
      status: "simulated_not_sent",
      body: "Tu saldo de Decision Credits llego a 0. Desde este momento, las consultas fuera de credito se liquidan a tarifa de Cliente Normal hasta que generes nuevos credits con carga de informacion.",
      createdAt: nowIso()
    });
    return;
  }

  if (currentBalance > 0 && currentBalance <= 1 && !hasLowNotice) {
    pushClientOutbox(target, {
      id: `email_credits_low_${Date.now()}`,
      type: "decision_credits_low",
      to: getClientEmail(target),
      subject: "Decision Credits por agotarse",
      status: "simulated_not_sent",
      body: `Tu saldo actual es ${currentBalance} Decision Credit. Si llega a 0, las siguientes consultas se liquidaran a tarifa Cliente Normal.`,
      createdAt: nowIso()
    });
  }
}

function getClientEmail(target) {
  const latest = target.outbox.find((item) => item.to);
  return latest?.to ?? `operaciones@${slugify(target.client.legalName)}.demo`;
}

function pushAdminAudit(event) {
  state.adminAudit.unshift({
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: nowIso(),
    ...event
  });
  state.adminAudit = state.adminAudit.slice(0, 80);
}

function normalizeAdminModules(modules) {
  const allowed = new Set(["dashboard", "onboarding", "clientes", "usuarios", "ingesta", "consumos", "facturacion", "auditoria", "notificaciones", "configuracion"]);
  const source = Array.isArray(modules) && modules.length > 0 ? modules : ["dashboard", "onboarding", "clientes"];
  return [...new Set(source.filter((moduleId) => allowed.has(moduleId)))];
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "cliente_demo";
}

function calculateTariff(product, target = getPrimaryClientTarget()) {
  const nextMonthlyVolume = target.usage.basicReports + target.usage.completeReports + 1;
  const tier = findPricingTier(nextMonthlyVolume);
  const mode = target.client.mode;
  const creditPolicy = getDecisionCreditPolicy(mode, product);
  const hasCredit = target.client.creditsBalance >= creditPolicy.creditCost && creditPolicy.creditCost > 0;
  const usesCredit = hasCredit;
  const previousBalance = target.client.creditsBalance;
  const tariff = resolveTariff({ mode, product, tier, usesCredit });

  if (usesCredit) {
    target.client.creditsBalance = roundCredits(target.client.creditsBalance - creditPolicy.creditCost);
    target.usage.creditsUsed = roundCredits(target.usage.creditsUsed + creditPolicy.creditCost);
    maybeNotifyCreditBalance(target, previousBalance);
  }

  return {
    ...tariff,
    creditCost: usesCredit ? creditPolicy.creditCost : 0
  };
}

function findPricingTier(monthlyVolume) {
  return pricingContract.queryTariffMatrix.find((tier) => {
    if (tier.monthlyVolume.endsWith("+")) {
      return monthlyVolume >= Number(tier.monthlyVolume.replace("+", ""));
    }
    const [minRaw, maxRaw] = tier.monthlyVolume.split("-");
    const min = Number(minRaw);
    const max = Number(maxRaw);
    return monthlyVolume >= min && monthlyVolume <= max;
  }) ?? pricingContract.queryTariffMatrix.at(-1);
}

function getDecisionCreditPolicy(mode, product) {
  if (mode === "Data Partner Founding") {
    if (product === "basic_report") {
      return { creditCost: 1, preferredTariffKey: "creditFree", priceWithCredit: 0 };
    }
    return { creditCost: 1, preferredTariffKey: "dataPartnerFounding" };
  }
  if (mode === "Data Partner Active") {
    if (product === "basic_report") {
      return { creditCost: 1, preferredTariffKey: "creditFree", priceWithCredit: 0 };
    }
    return { creditCost: 1, preferredTariffKey: "dataPartnerActive" };
  }
  if (mode === "Data Partner Contributor" && product === "basic_report") {
    return { creditCost: 1, preferredTariffKey: "creditFree", priceWithCredit: 0 };
  }
  return { creditCost: 0, preferredTariffKey: "clienteNormal" };
}

function getExcessTariffKey(mode, product) {
  if (mode.startsWith("Data Partner")) {
    return "clienteNormal";
  }
  return getDecisionCreditPolicy(mode, product).preferredTariffKey;
}

function buildTariffRule({ mode, product, usesCredit, tariffKey }) {
  if (usesCredit && product === "basic_report" && tariffKey === "creditFree") {
    return "data_partner_basic_report_free_with_credit";
  }
  if (usesCredit && mode === "Data Partner Founding") {
    return "data_partner_founding_credit_tariff_1_to_1";
  }
  if (usesCredit && mode === "Data Partner Active") {
    return "data_partner_active_credit_tariff_1_to_1";
  }
  if (usesCredit && mode === "Data Partner Contributor" && product === "basic_report") {
    return "data_partner_contributor_basic_credit_1_to_2";
  }
  if (mode.startsWith("Data Partner") && tariffKey === "clienteNormal") {
    return "cliente_normal_excess_tariff";
  }
  return "cliente_normal_public_tariff";
}

function getTariffBucket({ mode, usesCredit, tariffKey }) {
  if (usesCredit && mode.startsWith("Data Partner")) {
    return "data_partner_credit";
  }
  if (mode.startsWith("Data Partner") && tariffKey === "clienteNormal") {
    return "excess_cliente_normal";
  }
  return "cliente_normal";
}

function resolveTariff({ mode, product, tier, usesCredit }) {
  const creditPolicy = getDecisionCreditPolicy(mode, product);
  const tariffKey = usesCredit ? creditPolicy.preferredTariffKey : getExcessTariffKey(mode, product);
  const unitPrice = usesCredit && typeof creditPolicy.priceWithCredit === "number"
    ? creditPolicy.priceWithCredit
    : tier[tariffKey];
  const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : tier.clienteNormal;
  const rule = buildTariffRule({ mode, product, usesCredit, tariffKey });

  return {
    mode,
    product,
    creditApplied: usesCredit,
    rule,
    label: buildTariffLabel({ mode, product, usesCredit, tariffKey, rule }),
    tier: tier.monthlyVolume,
    unitPrice: safeUnitPrice,
    bucket: getTariffBucket({ mode, usesCredit, tariffKey }),
    estimatedValue: roundMoney(safeUnitPrice)
  };
}

function buildTariffLabel({ mode, product, usesCredit, tariffKey, rule }) {
  if (usesCredit && product === "basic_report" && tariffKey === "creditFree") {
    return "Reporte basico gratis con Decision Credit";
  }
  if (usesCredit && mode === "Data Partner Founding") {
    return "Tarifa Founding preferencial con Decision Credit";
  }
  if (usesCredit && mode === "Data Partner Active") {
    return "Tarifa Active preferencial con Decision Credit";
  }
  if (rule === "cliente_normal_excess_tariff") {
    return "Exceso a tarifa Cliente Normal";
  }
  return "Tarifa Cliente Normal";
}

function buildQueryEvent({ identifierType, identifier, product, channel, user, ip, tariff }) {
  const inhabilitations = product === "complete_report"
    ? buildInhabilitationsStatus({ identifierType, identifier })
    : undefined;

  return {
    id: `BAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bac: `BAC-${Date.now()}`,
    consent: `CONS-${identifier}`,
    user,
    channel,
    ip,
    identifierType,
    identifier,
    product,
    tariff: tariff.rule,
    tariffLabel: tariff.label,
    estimatedValue: tariff.estimatedValue,
    tariffTier: tariff.tier,
    unitPrice: tariff.unitPrice,
    creditApplied: tariff.creditApplied,
    creditCost: tariff.creditCost,
    tariffBucket: tariff.bucket,
    inhabilitations,
    status: "completed",
    createdAt: nowIso()
  };
}

function applyQueryUsage(event, target = getPrimaryClientTarget()) {
  if (event.product === "basic_report") {
    target.usage.basicReports += 1;
  } else if (event.product === "complete_report") {
    target.usage.completeReports += 1;
  }
  if (event.channel === "api") {
    target.usage.apiCalls += 1;
  }
  target.usage.estimatedSubtotal = roundMoney(target.usage.estimatedSubtotal + event.estimatedValue);
  if (event.tariffBucket === "data_partner_credit") {
    target.usage.dataPartnerCreditQueries += 1;
    target.usage.dataPartnerCreditSubtotal = roundMoney(target.usage.dataPartnerCreditSubtotal + event.estimatedValue);
  } else if (event.tariffBucket === "excess_cliente_normal") {
    target.usage.excessNormalQueries += 1;
    target.usage.excessNormalSubtotal = roundMoney(target.usage.excessNormalSubtotal + event.estimatedValue);
  } else {
    target.usage.clienteNormalQueries += 1;
    target.usage.clienteNormalSubtotal = roundMoney(target.usage.clienteNormalSubtotal + event.estimatedValue);
  }
}

function buildReportResult(event) {
  return {
    identifier: event.identifier,
    identifierType: event.identifierType,
    product: event.product,
    inhabilitations: event.inhabilitations,
    score: event.product === "basic_report" ? 812 : 991,
    riskBand: event.product === "basic_report" ? "Bajo" : "Excelente",
    reportUrl: event.product === "basic_report" ? "/reports/basic/demo" : "/reports/complete/demo",
    estimatedValue: event.estimatedValue,
    auditId: event.id
  };
}

function normalizeProduct(product) {
  const allowed = new Set(["basic_report", "complete_report"]);
  return allowed.has(product) ? product : "complete_report";
}

function buildInhabilitationsStatus({ identifierType, identifier }) {
  const blockedIdentifiers = new Map([
    ["cedula:0911111111", "Inhabilitado para girar cheques por sancion vigente simulada."],
    ["codigo_sb:SB-000234", "Inhabilitado para abrir cuentas corrientes por alerta operativa simulada."]
  ]);
  const key = `${identifierType}:${identifier}`;
  const reason = blockedIdentifiers.get(key);

  return {
    isInhabilitated: Boolean(reason),
    status: reason ? "inhabilitado" : "habilitado",
    checkedCapabilities: ["girar_cheques", "abrir_cuentas_corrientes"],
    reason: reason ?? "No registra inhabilidades vigentes en el sandbox Decision Data.",
    source: "decision_data_sandbox_inhabilitations",
    effectiveDate: "2026-05-26"
  };
}

function buildInvoicePreview() {
  return buildInvoicePreviewFor(state.usage, state.client.creditsBalance);
}

function buildInvoicePreviewFor(usage, creditsBalance) {
  const projectedMonthlyDepreciation = calculateMonthlyBalanceDepreciation(creditsBalance);
  const projectedBalanceAfterDepreciation = roundCredits(Math.max(0, creditsBalance - projectedMonthlyDepreciation));

  return {
    period: "2026-05",
    currency: "USD",
    billingMode: "monthly_postpaid",
    subtotal: roundMoney(usage.estimatedSubtotal),
    tax: roundMoney(usage.estimatedSubtotal * 0.15),
    total: roundMoney(usage.estimatedSubtotal * 1.15),
    creditsGenerated: usage.creditsGenerated,
    currentCreditsGenerated: usage.currentCreditsGenerated,
    historicalCreditsGenerated: usage.historicalCreditsGenerated,
    creditsUsed: usage.creditsUsed,
    creditsDepreciated: usage.creditsDepreciated,
    creditsBalance,
    balanceDepreciationPolicy: {
      monthlyFixedCredits: roundCredits(decisionCreditPolicy.monthlyBalanceDepreciationCredits),
      projectedMonthlyDepreciation,
      projectedBalanceAfterDepreciation,
      description: "Depreciacion fija mensual del saldo no usado para incentivar carga y consumo recurrente."
    },
    breakdown: {
      dataPartnerCreditQueries: usage.dataPartnerCreditQueries,
      dataPartnerCreditSubtotal: roundMoney(usage.dataPartnerCreditSubtotal),
      excessNormalQueries: usage.excessNormalQueries,
      excessNormalSubtotal: roundMoney(usage.excessNormalSubtotal),
      clienteNormalQueries: usage.clienteNormalQueries,
      clienteNormalSubtotal: roundMoney(usage.clienteNormalSubtotal)
    },
    note: "Simulacion tecnica. Liquidacion final y excepciones comerciales requieren aprobacion de Mateo."
  };
}

function calculateMonthlyBalanceDepreciation(creditsBalance) {
  return roundCredits(Math.min(Math.max(0, creditsBalance), decisionCreditPolicy.monthlyBalanceDepreciationCredits));
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function roundCredits(value) {
  return Math.round(value * 100) / 100;
}

function normalizeModules(modules) {
  const allowed = new Set(["inicio", "estado", "documentos", "carga", "consulta-individual", "consulta-bloque", "api", "facturacion", "auditoria", "notificaciones"]);
  const source = Array.isArray(modules) && modules.length > 0 ? modules : defaultSubUserModules;
  return [...new Set(source.filter((moduleId) => allowed.has(moduleId)))];
}

function cloneSubUser(subUser) {
  return {
    ...subUser,
    allowedModules: [...subUser.allowedModules]
  };
}
