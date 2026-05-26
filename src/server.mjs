import http from "node:http";
import { getConfig } from "./config/env.mjs";
import {
  readConsentContract,
  readDataExchangeContract,
  readDataPartnerDictionaryContract,
  readOnboardingContract,
  readPricingContract
} from "./routes/contracts.mjs";
import {
  loginResponse,
  readJsonBody,
  registerClientResponse
} from "./routes/auth.mjs";
import {
  approveDemoAccessRequest,
  buildTemplate,
  createAdminClient,
  createAdminUser,
  createDemoSubUser,
  getDemoState,
  getUsageResponse,
  ingestInformationBlocks,
  listDemoAccessRequests,
  observeDemoAccessRequest,
  resetDemoState,
  runBatchQuery,
  runIndividualQuery,
  updateAdminSettings,
  updateAdminUser,
  updateDemoSubUser
} from "./routes/demo.mjs";
import { buildHealthResponse, writeJson } from "./routes/health.mjs";

const config = getConfig();

const server = http.createServer(async (request, response) => {
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

  if (request.method === "GET" && url.pathname === "/contracts/v1/onboarding") {
    writeJson(response, 200, readOnboardingContract());
    return;
  }

  if (request.method === "GET" && url.pathname === "/contracts/v1/pricing") {
    writeJson(response, 200, readPricingContract());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/login") {
    writeJson(response, 200, loginResponse(await readJsonBody(request)));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/client-registration") {
    const result = registerClientResponse(await readJsonBody(request));
    writeJson(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/admin/access-requests") {
    writeJson(response, 200, listDemoAccessRequests());
    return;
  }

  const observeMatch = url.pathname.match(/^\/api\/v1\/admin\/access-requests\/([^/]+)\/observe$/);
  if (request.method === "POST" && observeMatch) {
    writeJson(response, 202, observeDemoAccessRequest(observeMatch[1], await readJsonBody(request)));
    return;
  }

  const approveMatch = url.pathname.match(/^\/api\/v1\/admin\/access-requests\/([^/]+)\/approve$/);
  if (request.method === "POST" && approveMatch) {
    const result = approveDemoAccessRequest(approveMatch[1], await readJsonBody(request));
    writeJson(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/demo/state") {
    writeJson(response, 200, getDemoState());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/admin/clients") {
    writeJson(response, 201, createAdminClient(await readJsonBody(request)));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/admin/users") {
    writeJson(response, 201, createAdminUser(await readJsonBody(request)));
    return;
  }

  const adminUserMatch = url.pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)$/);
  if (request.method === "POST" && adminUserMatch) {
    const result = updateAdminUser(adminUserMatch[1], await readJsonBody(request));
    writeJson(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/admin/settings") {
    const result = updateAdminSettings(await readJsonBody(request));
    writeJson(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/demo/reset") {
    writeJson(response, 200, resetDemoState());
    return;
  }

  const templateMatch = url.pathname.match(/^\/api\/v1\/templates\/([^/]+)$/);
  if (request.method === "GET" && templateMatch) {
    writeText(response, 200, buildTemplate(templateMatch[1]), "text/csv; charset=utf-8");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/ingestion/information-blocks") {
    writeJson(response, 202, ingestInformationBlocks(await readJsonBody(request)));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/queries") {
    writeJson(response, 200, runIndividualQuery(await readJsonBody(request)));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/batch-queries") {
    writeJson(response, 202, runBatchQuery(await readJsonBody(request)));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/usage") {
    writeJson(response, 200, getUsageResponse());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/client/subusers") {
    writeJson(response, 201, createDemoSubUser(await readJsonBody(request)));
    return;
  }

  const subUserMatch = url.pathname.match(/^\/api\/v1\/client\/subusers\/([^/]+)$/);
  if (request.method === "POST" && subUserMatch) {
    const result = updateDemoSubUser(subUserMatch[1], await readJsonBody(request));
    writeJson(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "GET" && url.pathname === "/") {
    writeJson(response, 200, {
      service: config.serviceName,
      message: "Data Exchange backend bootstrap. Use /health.",
      phase: "2-auth-visual"
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

function writeText(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}
