const validReporterSectors = new Set([
  "Telco / ISP",
  "Retail",
  "Casa comercial",
  "Concesionario",
  "Fintech",
  "Cobranza / BPO",
  "Industria / mayorista"
]);

const validModes = new Set([
  "Cliente Normal",
  "Data Partner Contributor",
  "Data Partner Active",
  "Data Partner Founding"
]);

export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

export function loginResponse(body) {
  const mode = body.mode === "pending" ? "pending" : "approved";

  return {
    status: "ok",
    phase: "2-auth-visual",
    tokenType: "visual_session_only",
    user: {
      email: body.email ?? "operaciones@megadatos.demo",
      role: mode === "pending" ? "pending_client_owner" : "client_owner",
      accountState: mode,
      mustChangeTemporaryPassword: mode === "approved"
    },
    allowedModules:
      mode === "pending"
        ? ["estado", "documentos", "carga_no_productiva", "notificaciones"]
        : ["estado", "documentos", "subusuarios", "carga", "consulta_individual", "consulta_bloque", "api", "facturacion", "auditoria", "notificaciones"]
  };
}

export function registerClientResponse(body) {
  const missing = [];

  if (!/^\d{13}$/.test(String(body.ruc ?? ""))) {
    missing.push("ruc");
  }

  if (!body.legalName) {
    missing.push("legalName");
  }

  if (!String(body.email ?? "").includes("@")) {
    missing.push("email");
  }

  if (!validReporterSectors.has(body.sector)) {
    missing.push("sector");
  }

  if (!validModes.has(body.mode)) {
    missing.push("mode");
  }

  if (missing.length > 0) {
    return {
      statusCode: 422,
      payload: {
        status: "validation_error",
        missing,
        message: "Autorregistro visual incompleto."
      }
    };
  }

  return {
    statusCode: 202,
    payload: {
      status: "pending_admin_review",
      requestId: "REQ-2026-MEGADATOS-DEMO",
      nextState: "email_confirmation_and_document_review",
      productionAccess: false,
      sandboxUploadAllowed: true,
      message: "Solicitud recibida. Productivo queda bloqueado hasta aprobacion documental completa."
    }
  };
}

export function listAccessRequestsResponse() {
  return {
    status: "ok",
    requests: [
      {
        id: "REQ-2026-MEGADATOS-DEMO",
        legalName: "MEGADATOS S.A.",
        sector: "Telco / ISP",
        mode: "Data Partner Founding",
        state: "documents_observed",
        productionAccess: false,
        sandboxUploadAllowed: true,
        blockingDocumentsMissing: ["ruc", "legal-appointment", "legal-id", "data-source"]
      }
    ]
  };
}

export function observeAccessRequestResponse(id, body) {
  return {
    status: "observation_registered",
    requestId: id,
    observation: body.observation ?? "Documentos habilitantes pendientes.",
    notifyClient: false,
    emailSending: "reserved_phase_2_provider",
    bac: {
      eventType: "admin_onboarding_observation",
      appendOnly: true
    }
  };
}

export function approveAccessRequestResponse(id, body) {
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

  return {
    statusCode: 202,
    payload: {
      status: "approved_visual",
      requestId: id,
      temporaryPasswordEmail: "reserved_not_sent",
      mustChangeTemporaryPassword: true,
      productionAccess: true,
      bac: {
        eventType: "admin_access_approval",
        appendOnly: true
      }
    }
  };
}
