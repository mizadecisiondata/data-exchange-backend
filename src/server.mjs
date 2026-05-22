import http from "node:http";
import { getConfig } from "./config/env.mjs";
import {
  readConsentContract,
  readDataExchangeContract,
  readDataPartnerDictionaryContract,
  readPricingContract
} from "./routes/contracts.mjs";
import { buildHealthResponse, writeJson } from "./routes/health.mjs";

const config = getConfig();

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/healthz")) {
    writeJson(response, 200, buildHealthResponse(config));
    return;
  }

  if (request.method === "GET" && url.pathname === "/contracts/v1") {
    writeJson(response, 200, readDataExchangeContract());
    return;
  }

  if (request.method === "GET" && url.pathname === "/contracts/v1/consent") {
    writeJson(response, 200, readConsentContract());
    return;
  }

  if (request.method === "GET" && url.pathname === "/contracts/v1/data-partner-dictionary") {
    writeJson(response, 200, readDataPartnerDictionaryContract());
    return;
  }

  if (request.method === "GET" && url.pathname === "/contracts/v1/pricing") {
    writeJson(response, 200, readPricingContract());
    return;
  }

  if (request.method === "GET" && url.pathname === "/") {
    writeJson(response, 200, {
      service: config.serviceName,
      message: "Data Exchange backend bootstrap. Use /health.",
      phase: "0"
    });
    return;
  }

  writeJson(response, 404, {
    status: "not_found",
    service: config.serviceName,
    path: url.pathname
  });
});

server.listen(config.port, config.host, () => {
  console.log(`${config.serviceName} listening on http://${config.host}:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing ${config.serviceName}`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
