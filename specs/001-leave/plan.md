# Implementation Plan: Leave Balance + Apply-Leave Widget

**Feature**: Leave Balance + Apply-Leave Widget

**Feature Dir**: `specs/001-leave`

**Created**: 2026-05-22

**Stack**: Next.js 14 (app router) + Prisma + Postgres

Purpose: Provide a concrete, stack-specific implementation plan that honors the project constitution and satisfies the spec's functional and non-functional requirements.

---

## Technical Context (concise)

- Identity & Auth: all authentication via corporate IdP (OIDC). No local accounts.
- Time: all timestamps normalized and persisted in UTC (ISO8601). Server clocks NTP-synced.
- PII: redact/mask PII before any log emission; never log raw identifiers.
- Secrets: injected via environment variables or a secrets manager; never in code.
- Observability: every write (create/update/delete) emits a structured log containing `actor`, `action`, `entity_id`, `timestamp` (UTC), and `outcome`.

---

## High-level Design

- Next.js renders the dashboard widget server-side for first paint; client-side enables the 3-field form and optimistic UI for submissions.
- The client implements explicit validation to block submission when `from-date` is after `to-date`, and the write endpoint enforces the same date-range guard server-side.
- The client and API both return clear, UX-friendly errors: `Insufficient balance` for balance failures and `Submission failed — please retry` for transient write failures.
- API layer (Next.js server functions / server-only handlers) exposes two read operations (balances + recent 5 requests) and one write (submit leave). Prisma talks to Postgres for authoritative data; a small Redis cache (or in-memory edge cache) fronts the primary read to meet p95 constraints.
- Writes are synchronous to Postgres and replicated to the cache/readonly store; each write emits the required structured audit log event.

---

## NFRs and Concrete Design Responses

- NFR-001 (Performance — p95 <= 500 ms for primary read):
  - Design: Serve primary read from an aggregated read model cached in Redis with a default TTL of 30s (configurable). On cache miss, read optimized SQL that joins `leave_balances` and `leave_requests` limited to 5 rows; ensure indexes on `employee_id` and request `created_at`. Load tests use the dataset assumption (≤20 leave types, ≤50 history rows). Measure p95 with distributed tracing and synthetic users.
  - Rationale: Cached reads deliver the fast dashboard experience the P1 employee needs while meeting the required p95 threshold.

- NFR-002 (Availability — 99.5% business hours):
  - Design: Implement exponential backoff + circuit breaker in client; degrade gracefully to read-only last-known balances on backend cache-only mode with visible banner. Health checks for DB, IdP, and cache; pager alerts triggered on failing health checks beyond threshold.
  - Rationale: Maintaining dashboard availability preserves self-service access for employees, while explicit degraded UI keeps the experience transparent.

- NFR-003 (Data Freshness — balances reflect reconciliation within 5 minutes):
  - Design: Authoritative write path updates balances; a background reconciliation job runs every 1–5 minutes to reconcile authoritative system snapshots into the read model. Cache TTL capped at 5 minutes to ensure visibility of changes.
  - Rationale: Bounded staleness ensures the employee sees near-real-time balances without coupling the widget to slower upstream reconciliation processes.

---

## Failure Modes & Trade-offs

1) IdP outage (auth provider unreachable)
   - Failure: Users cannot obtain fresh tokens; sign-in or token refresh fails.
   - Trade-offs: Block all access until IdP returns (strong consistency) vs allow cached sessions/read-only access (availability).
   - Chosen approach: Allow short-lived cached sessions for already-authenticated users (e.g., within token grace window) and show read-only balances with explicit banner; require login for write actions. Rationale: Minimizes disruption while preventing unauthorized writes.

2) Cache stampede / Redis outage causing DB overload
   - Failure: Many simultaneous cache misses flood Postgres and raise p95 drastically.
   - Trade-offs: Serve stale cached data or fallback to DB (fresh) at cost of latency/DB load.
   - Chosen approach: Use request coalescing / singleflight on cache miss and a small stale-while-revalidate window (serve last-known data up to 5 minutes) to protect DB. Rationale: Protects latency and availability for reads while keeping staleness bounded per NFR.

3) Write consistency vs UX (synchronous write blocking for recalculation)
   - Failure: Synchronous recalculation of balances increases write latency and may breach UX expectations.
   - Trade-offs: Block write until balances recalc (strict consistency) vs accept write and reconcile asynchronously (eventual consistency).
   - Chosen approach: Perform the leave request write synchronously (to guarantee persistence) but update the read-model asynchronously; immediately emit structured `actor/action/entity_id` log and return `Pending` status; show optimistic UI entry. Rationale: Guarantees persistence and auditability while keeping writes responsive.

---

## Minimum Data-Model Slice (P1 needs only)

Minimal entities required for the widget and apply flow:

- Employee: { id, displayName (redacted in logs), employeeNumber }
- LeaveType: { id, name }
- LeaveBalance: { id, employeeId, leaveTypeId, remainingDays, updatedAt(UTC) }
- LeaveRequest: { id, employeeId, leaveTypeId, fromDate(UTC), toDate(UTC), status, createdAt(UTC) }

Prisma-style illustrative slice (implementation detail for plan only):

```prisma
model Employee {
  id            String  @id @default(uuid())
  displayName   String
  employeeNumber String @unique
  LeaveBalance  LeaveBalance[]
  LeaveRequest  LeaveRequest[]
}

model LeaveType {
  id   String @id @default(uuid())
  name String
}

model LeaveBalance {
  id          String  @id @default(uuid())
  employeeId  String
  leaveTypeId String
  remainingDays Float
  updatedAt   DateTime @updatedAt
}

model LeaveRequest {
  id          String   @id @default(uuid())
  employeeId  String
  leaveTypeId String
  fromDate    DateTime
  toDate      DateTime
  status      String
  createdAt   DateTime @default(now())
}
```

Note: Prisma models are a minimal slice to guide migrations; full schema and indices are defined during implementation.

---

## Observability & Audit

- Every write emits a structured log event in JSON with: `actor` (employee:ID), `action` (create_leave_request), `entity_id` (leaveRequest:ID), `timestamp` (UTC), `outcome` (success|failure), and `metadata` (redacted fields). Example:

```json
{"actor":"employee:123","action":"create_leave_request","entity_id":"lr:456","timestamp":"2026-05-22T12:34:56Z","outcome":"success"}
```

- Logs MUST not contain raw PII; `displayName` or email must be replaced with `REDACTED` or hashed identifier.
- Traces for read and write flows instrument critical spans: cache lookup, DB query, reconciliation job, and IdP calls.

---

## Security & Secrets

- Enforce IdP authentication for all endpoints; reject anonymous writes.
- Secrets loaded from environment or a secrets manager; never stored in repository.
- Sanitize and parameterize all inputs (Prisma helps avoid SQL injection).

---

## Tasks & Milestones

1. Infrastructure & infra-as-code (Postgres, Redis, secrets) — 1 day
2. Prisma schema + migrations (slice above) — 1 day
3. Next.js server handlers: read endpoints (balances + recent 5) — 2 days
4. Cache layer + singleflight/coalescing — 1 day
5. Client widget UI + 3-field form + optimistic UI — 2 days
6. Write path + structured logging + retry UX — 1 day
7. Reconciliation job + tests — 1 day
8. Load/perf testing for p95, instrumentation, and alerts — 2 days
9. Documentation, runbooks, and deployment — 1 day

Estimate: 10–12 workdays to reach a production-ready v1 with monitoring and load tests.

---

## Monitoring, Metrics & Alerts

- Metrics: primary_read_p95_ms, primary_read_success_rate, write_success_rate, reconciliation_lag_seconds, auth_errors_per_minute.
- Alerts: p95 > 500 ms for 5 consecutive 5-minute windows; write_error_rate > 1% for 5 minutes; reconciliation_lag > 300s.

---

## Migration & Rollout

- Rollout strategy: feature-flagged release to 5% of users → 25% → 100% with metrics gating on p95 and error rates.
- Backfill: If read-model missing, on-demand builder reconstructs balances from authoritative sources.

---

## Open Implementation Questions

- Exact IdP token claims to use for `actor` identification (e.g., `sub` vs `employeeNumber`) — implementation should default to `employeeNumber` if present.
- How to reconcile external authoritative system change events (push vs pull) — plan supports both; integration chosen during implementation.

---

## Tuple‑Fit Note

This design favors fast, available reads (cached aggregated read model + Redis), explicit form validation, and clear insufficient-balance messaging to support the P1 employee persona’s need for immediate dashboard visibility and reliable self-service leave submission. It also aligns tightly with the p95 ≤ 500 ms NFR and the constitution’s requirements for auth, UTC timestamps, PII redaction, secrets handling, and structured observability.
