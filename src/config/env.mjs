const DEFAULTS = {
  NODE_ENV: "development",
  BACKEND_HOST: "127.0.0.1",
  BACKEND_PORT: "4100",
  SERVICE_NAME: "data-exchange-backend",
  INGESTION_QUALITY_THRESHOLD: "0.95",
  BILLING_MODE: "monthly_postpaid",
  ALLOW_PREPAID_PRIMARY_MODEL: "false",
  BAC_APPEND_ONLY: "true"
};

function toBoolean(value) {
  return String(value).toLowerCase() === "true";
}

function toNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected numeric value, received ${value}`);
  }

  return parsed;
}

export function getConfig(env = process.env) {
  const source = { ...DEFAULTS, ...env };
  const ingestionQualityThreshold = toNumber(source.INGESTION_QUALITY_THRESHOLD);

  if (ingestionQualityThreshold !== 0.95) {
    throw new Error("INGESTION_QUALITY_THRESHOLD is reserved to Mateo and must remain 0.95 in Fase 0.");
  }

  if (source.BILLING_MODE !== "monthly_postpaid") {
    throw new Error("BILLING_MODE must remain monthly_postpaid unless Mateo approves a change.");
  }

  return {
    environment: source.NODE_ENV,
    host: source.BACKEND_HOST,
    port: Number(source.BACKEND_PORT),
    serviceName: source.SERVICE_NAME,
    ingestionQualityThreshold,
    billingMode: source.BILLING_MODE,
    allowPrepaidPrimaryModel: toBoolean(source.ALLOW_PREPAID_PRIMARY_MODEL),
    bacAppendOnly: toBoolean(source.BAC_APPEND_ONLY)
  };
}
