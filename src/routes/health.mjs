export function buildHealthResponse(config, now = new Date()) {
  return {
    status: "ok",
    service: config.serviceName,
    phase: "0",
    environment: config.environment,
    timestamp: now.toISOString(),
    rules: {
      billingMode: config.billingMode,
      allowPrepaidPrimaryModel: config.allowPrepaidPrimaryModel,
      ingestionQualityThreshold: config.ingestionQualityThreshold,
      bacAppendOnly: config.bacAppendOnly,
      duplicatePolicy: "discard_without_error_or_credits",
      queryIdentifierPolicy: "cedula_ruc_or_codigo_sb"
    },
    portals: {
      client: "reserved",
      admin: "reserved",
      agentWorkbench: "admin_only_reserved"
    }
  };
}

export function writeJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}
