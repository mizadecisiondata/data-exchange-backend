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
    usage: {
      basicReports: 0,
      completeReports: 0,
      apiCalls: 0,
      estimatedSubtotal: 0,
      creditsGenerated: 0,
      creditsUsed: 0
    },
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
    invoicePreview: buildInvoicePreview()
  };
}

export function listDemoAccessRequests() {
  return {
    status: "ok",
    requests: [buildAccessRequest()]
  };
}

export function observeDemoAccessRequest(id, body) {
  const event = {
    id: `email_observation_${Date.now()}`,
    type: "document_observation",
    to: "operaciones@megadatos.demo",
    subject: "Observacion documental - Decision Data",
    status: "simulated_not_sent",
    body: body.observation ?? "Documentos habilitantes pendientes.",
    createdAt: nowIso()
  };
  state.outbox.unshift(event);

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

  state.documents = Object.fromEntries(Object.keys(state.documents).map((key) => [key, true]));
  state.client.state = "approved";
  state.client.productionAccess = true;
  state.client.sandboxUploadAllowed = true;
  state.outbox.unshift({
    id: `email_temp_credentials_${Date.now()}`,
    type: "temporary_credentials",
    to: "operaciones@megadatos.demo",
    subject: "Acceso aprobado - credenciales temporales Decision Data",
    status: "simulated_not_sent",
    body: "Usuario temporal generado en sandbox. En produccion se enviara por proveedor transaccional.",
    createdAt: nowIso()
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
  const rows = Array.isArray(body.rows) && body.rows.length > 0 ? body.rows : sampleInformationRows;
  const seen = new Set();
  const duplicates = [];
  const accepted = [];
  const errors = [];

  rows.forEach((row, index) => {
    const key = `${row.identifierType}:${row.identifier}`;
    if (seen.has(key)) {
      duplicates.push({ index, identifier: row.identifier });
      return;
    }
    seen.add(key);

    if (!row.identifierType || !row.identifier || !row.holderName || row.consent !== true) {
      errors.push({ index, reason: "missing_required_field_or_consent" });
      return;
    }

    accepted.push(row);
  });

  const denominator = rows.length - duplicates.length;
  const qualityScore = denominator === 0 ? 0 : accepted.length / denominator;
  const status = qualityScore >= 0.95 ? "accepted" : "rejected_quality_below_95";
  const creditsGenerated = status === "accepted" ? accepted.length : 0;
  const upload = {
    id: `UPL-${Date.now()}`,
    status,
    mode: state.client.productionAccess ? "productive_sandbox" : "non_productive_sandbox",
    rowsReceived: rows.length,
    acceptedRows: accepted.length,
    duplicateRows: duplicates.length,
    errorRows: errors.length,
    qualityScore,
    threshold: 0.95,
    duplicatesPolicy: "discarded_without_error_or_credits",
    creditsGenerated,
    createdAt: nowIso()
  };

  state.uploads.unshift(upload);
  state.client.creditsBalance += creditsGenerated;
  state.usage.creditsGenerated += creditsGenerated;

  return {
    status: "ok",
    upload,
    duplicates,
    errors,
    state: getDemoState()
  };
}

export function runIndividualQuery(body = {}) {
  const product = body.product === "basic_report" ? "basic_report" : "complete_report";
  const channel = body.channel ?? "portal";
  const tariff = calculateTariff(product);
  const event = buildQueryEvent({
    identifierType: body.identifierType ?? "cedula",
    identifier: body.identifier ?? "0923048581",
    product,
    channel,
    user: body.user ?? "operaciones@megadatos.demo",
    ip: body.ip ?? "127.0.0.1",
    tariff
  });

  applyQueryUsage(event);
  state.queries.unshift(event);

  return {
    status: "ok",
    result: buildReportResult(event),
    audit: event,
    state: getDemoState()
  };
}

export function runBatchQuery(body = {}) {
  const rows = Array.isArray(body.rows) && body.rows.length > 0 ? body.rows : sampleBatchRows;
  const events = rows.map((row) => {
    const tariff = calculateTariff(row.product === "basic_report" ? "basic_report" : "complete_report");
    const event = buildQueryEvent({
      identifierType: row.identifierType,
      identifier: row.identifier,
      product: row.product === "basic_report" ? "basic_report" : "complete_report",
      channel: "batch",
      user: body.user ?? "operaciones@megadatos.demo",
      ip: body.ip ?? "127.0.0.1",
      tariff
    });
    applyQueryUsage(event);
    return event;
  });

  const batch = {
    id: `BATCH-${Date.now()}`,
    status: "processed",
    rowsReceived: rows.length,
    rowsProcessed: events.length,
    estimatedSubtotal: roundMoney(events.reduce((sum, event) => sum + event.estimatedValue, 0)),
    createdAt: nowIso()
  };

  state.batchQueries.unshift(batch);
  state.queries.unshift(...events);

  return {
    status: "ok",
    batch,
    results: events.map(buildReportResult),
    audits: events,
    state: getDemoState()
  };
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

export function createDemoSubUser(body = {}) {
  const subUser = {
    id: `subuser_${Date.now()}`,
    name: body.name ?? "Nuevo subusuario",
    email: body.email ?? `subusuario.${state.subUsers.length + 1}@megadatos.demo`,
    role: body.role ?? "Operador cliente",
    status: "active",
    allowedModules: normalizeModules(body.allowedModules),
    mustChangeTemporaryPassword: true,
    createdAt: nowIso()
  };

  state.subUsers.unshift(subUser);
  state.outbox.unshift({
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
  const subUser = state.subUsers.find((item) => item.id === id);
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

function calculateTariff(product) {
  const nextMonthlyVolume = state.usage.basicReports + state.usage.completeReports + 1;
  const tier = findPricingTier(nextMonthlyVolume);
  const mode = state.client.mode;
  const tariffKey = getTariffKey(mode, product);
  const matrixValue = tier[tariffKey];
  const isDataPartner = mode.startsWith("Data Partner");
  const basicIncluded = product === "basic_report" && isDataPartner;
  const estimatedValue = basicIncluded ? 0 : matrixValue;
  const usesCredit = basicIncluded && state.client.creditsBalance > 0;

  if (usesCredit) {
    state.client.creditsBalance = Math.max(0, state.client.creditsBalance - 1);
    state.usage.creditsUsed += 1;
  }

  return {
    mode,
    product,
    creditApplied: usesCredit,
    rule: buildTariffRule({ mode, product, basicIncluded, tariffKey }),
    tier: tier.monthlyVolume,
    unitPrice: matrixValue,
    estimatedValue: roundMoney(estimatedValue)
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

function getTariffKey(mode, product) {
  if (mode === "Data Partner Founding") {
    return "dataPartnerFounding";
  }
  if (mode === "Data Partner Active") {
    return "dataPartnerActive";
  }
  if (mode === "Data Partner Contributor" && product === "basic_report") {
    return "clienteNormal";
  }
  return "clienteNormal";
}

function buildTariffRule({ mode, product, basicIncluded, tariffKey }) {
  if (basicIncluded) {
    return `${normalizeRuleMode(mode)}_basic_included_with_consent`;
  }
  if (tariffKey === "dataPartnerFounding") {
    return "data_partner_founding_lowest_tariff_12_months";
  }
  if (tariffKey === "dataPartnerActive") {
    return "data_partner_active_preferential_tariff";
  }
  if (mode === "Data Partner Contributor" && product !== "basic_report") {
    return "data_partner_contributor_complete_at_cliente_normal_tariff";
  }
  return "cliente_normal_public_tariff";
}

function normalizeRuleMode(mode) {
  return mode.toLowerCase().replaceAll(" ", "_");
}

function buildQueryEvent({ identifierType, identifier, product, channel, user, ip, tariff }) {
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
    estimatedValue: tariff.estimatedValue,
    tariffTier: tariff.tier,
    unitPrice: tariff.unitPrice,
    creditApplied: tariff.creditApplied,
    status: "completed",
    createdAt: nowIso()
  };
}

function applyQueryUsage(event) {
  if (event.product === "basic_report") {
    state.usage.basicReports += 1;
  } else {
    state.usage.completeReports += 1;
  }
  if (event.channel === "api") {
    state.usage.apiCalls += 1;
  }
  state.usage.estimatedSubtotal = roundMoney(state.usage.estimatedSubtotal + event.estimatedValue);
}

function buildReportResult(event) {
  return {
    identifier: event.identifier,
    identifierType: event.identifierType,
    product: event.product,
    score: event.product === "basic_report" ? 812 : 991,
    riskBand: event.product === "basic_report" ? "Bajo" : "Excelente",
    reportUrl: event.product === "basic_report" ? "/reports/basic/demo" : "/reports/complete/demo",
    estimatedValue: event.estimatedValue,
    auditId: event.id
  };
}

function buildInvoicePreview() {
  return {
    period: "2026-05",
    currency: "USD",
    billingMode: "monthly_postpaid",
    subtotal: roundMoney(state.usage.estimatedSubtotal),
    tax: roundMoney(state.usage.estimatedSubtotal * 0.15),
    total: roundMoney(state.usage.estimatedSubtotal * 1.15),
    creditsGenerated: state.usage.creditsGenerated,
    creditsUsed: state.usage.creditsUsed,
    creditsBalance: state.client.creditsBalance,
    note: "Simulacion tecnica. Liquidacion final y excepciones comerciales requieren aprobacion de Mateo."
  };
}

function roundMoney(value) {
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
