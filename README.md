# Data Exchange Backend

Backend bootstrap para Data Exchange de Decision Data.

## Stack objetivo

- NestJS + TypeScript.
- PostgreSQL.
- Redis + BullMQ para colas, cache y rate limits.
- Object storage S3-compatible.
- OpenAPI/Swagger.
- Workers asincronos para ingesta y consulta masiva.
- BAC append-only.

Fase 0 usa un servidor Node.js sin dependencias para validar el healthcheck antes de instalar frameworks.

## Comandos

PowerShell:

```powershell
npm.cmd run dev
npm.cmd run health
npm.cmd run lint
npm.cmd run test
```

Bash/CI:

```bash
npm run dev
npm run health
npm run lint
npm run test
```

## Healthcheck

```text
GET http://localhost:4100/health
GET http://localhost:4100/healthz
GET http://localhost:4100/contracts/v1
```

## Modulos iniciales

- `companies`: companias, modalidades y perfiles.
- `ingestion`: bloques de informacion, calidad 95%, duplicados.
- `decision-credits`: ledger y reglas de reciprocidad.
- `queries`: consulta individual, por bloque y API.
- `billing`: postpago mensual y estimacion.
- `bac`: auditoria completa.
- `agent-workbench`: telemetria de agentes para portal admin.

No se implementan flujos de negocio reales en Fase 0.

## Contrato de Fase 1

`GET /contracts/v1` expone un contrato tecnico de guardrails y rutas reservadas para alinear frontend, backend y aprobacion de Mateo. Este contrato no ejecuta pricing, decision credits, consultas ni ingesta real; solo fija las reglas que no deben cambiar sin aprobacion.
