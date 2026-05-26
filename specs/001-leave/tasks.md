# Tasks: Leave Balance + Apply-Leave Widget

**Input**: Design documents from `/specs/001-leave/`

**Prerequisites**: `spec.md` and `plan.md` in the feature directory.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the project structure, dependencies, and environment settings needed for the leave widget implementation.

**Entry condition**: Feature approval and access to repo.

**Exit condition**: Next.js + Prisma project structure is in place, environment variables are defined, and shared libraries exist for auth, logging, and caching.

- [x] T001 [P] Create `app/components/leave-widget.tsx` and `app/page.tsx` stubs for the dashboard widget UI.
- [ ] T002 [P] Add `src/lib/prisma.ts` for Prisma client initialization and `prisma/schema.prisma` placeholder.
- [ ] T003 [P] Add `src/lib/auth.ts` with IdP token extraction and employee identity helper.
- [ ] T004 [P] Add `src/lib/logging.ts` with structured logging helpers for `actor`, `action`, `entity_id`, `timestamp`, and `outcome`.
- [ ] T005 [P] Add `src/lib/cache.ts` with Redis cache helpers and TTL configuration support.
- [ ] T006 Create `.env.example` documenting `DATABASE_URL`, `REDIS_URL`, and other runtime secrets.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the core backend and infrastructure components that all user stories depend on.

**Entry condition**: Phase 1 complete.

**Exit condition**: Database schema and backend service layer exist, and the API can authenticate requests and emit structured logs.

- [ ] T007 [P] Define the Prisma data model for `Employee`, `LeaveType`, `LeaveBalance`, and `LeaveRequest` in `prisma/schema.prisma`.
- [ ] T008 [P] Add Postgres migration scripts via `npx prisma migrate dev` and check in migration files.
- [ ] T009 [P] Implement `src/server/leave.ts` with read handlers for balances and recent 5 leave requests.
- [ ] T010 [P] Implement `src/server/leave.ts` write handler for leave requests with date-range validation and insufficient-balance rejection.
- [ ] T011 [P] Implement `src/server/auth-middleware.ts` to enforce IdP authentication and attach `employeeId` to request context.
- [ ] T012 [P] Implement cache integration in `src/server/leave.ts` using `src/lib/cache.ts` for primary read caching with a configurable 30s TTL.
- [ ] T013 Set up `src/lib/validation.ts` with the `from-date <= to-date` guard and reusable validation messages.
- [ ] T014 Add `src/server/metrics.ts` stubs for `primary_read_p95_ms`, `write_success_rate`, and `reconciliation_lag_seconds` instrumentation.

---

## Phase 3: User Story 1 - View and Apply Leave (Priority: P1) 🎯 MVP

**Goal**: Deliver the dashboard widget so an employee can see leave balances, submit leave via the 3-field form, and view the status of the last 5 requests.

**Independent Test**: Load the dashboard as an authenticated employee, confirm leave balances and recent requests appear, submit a valid request, and verify the request appears as `Pending`.

### Tests for User Story 1

- [ ] T015 [T] [P] [US1] Add integration test in `tests/integration/leave-widget.spec.ts` verifying balances, recent 5 requests, and successful `Pending` submission.
- [ ] T016 [T] [P] [US1] Add contract test in `tests/contract/leave-api.spec.ts` verifying the `GET /leave/dashboard` read response shape and `POST /leave/request` error messages.
- [ ] T017 [T] [US1] Add performance test in `tests/performance/leave-read.pact.ts` that measures p95 for primary read with 20 leave types and 50 historical requests.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement server read query in `src/server/leave.ts` to return leave balances and the last 5 requests.
- [ ] T019 [P] [US1] Implement `app/components/leave-widget.tsx` to render balances, the 3-field form, and recent request status.
- [ ] T020 [P] [US1] Implement leave request submission in `app/components/leave-widget.tsx` with optimistic UI and error handling.
- [ ] T021 [US1] Add client-side validation for `from-date` <= `to-date` in `app/components/leave-widget.tsx` and surface `Invalid date range`.
- [ ] T022 [US1] Add client-side display of `Insufficient balance` and transient retry errors in `app/components/leave-widget.tsx`.
- [ ] T023 [US1] Add server-side `Pending` status assignment and structured logging in `src/server/leave.ts`.
- [ ] T024 [US1] Add Redis cache read path and cache staleness handling in `src/server/leave.ts`.

**Checkpoint**: P1 story is complete when the leave widget loads with balances, recent requests, and valid leave submissions produce a pending request entry.

---

## Phase 4: User Story 2 - Quick Retry & Lightweight Validation (Priority: P2)

**Goal**: Improve the widget by providing inline validation feedback for invalid date ranges and retry-friendly submission flows.

**Independent Test**: Attempt to submit a leave request with `from-date` after `to-date` and confirm the widget blocks submission with a clear message.

### Tests for User Story 2

- [ ] T025 [T] [US2] Add integration test in `tests/integration/leave-validation.spec.ts` for invalid date-range rejection.

### Implementation for User Story 2

- [ ] T026 [P] [US2] Enhance `app/components/leave-widget.tsx` with inline validation for date-range errors before submission.
- [ ] T027 [US2] Add server-side validation reporting in `src/server/leave.ts` to reject invalid date ranges and return a consistent error payload.
- [ ] T028 [US2] Add retry logic and user-facing guidance in `app/components/leave-widget.tsx` for transient errors.

**Checkpoint**: P2 story is complete when invalid date ranges are blocked client-side and server-side, with explicit validation messages and retry guidance.

---

## Phase 5: User Story 3 - Recent Requests Summary (Priority: P3)

**Goal**: Ensure the widget surfaces the employee's five most recent leave requests in newest-first order.

**Independent Test**: Load the widget for an employee with more than five requests and verify only the latest five appear.

### Tests for User Story 3

- [ ] T029 [P] [US3] Add integration test in `tests/integration/leave-recent-requests.spec.ts` verifying newest-first ordering and a maximum of 5 items.

### Implementation for User Story 3

- [ ] T030 [P] [US3] Implement recent request ordering logic in `src/server/leave.ts`.
- [ ] T031 [P] [US3] Display the latest five requests in `app/components/leave-widget.tsx` with status labels.

**Checkpoint**: P3 story is complete when the widget shows exactly 5 recent requests, ordered newest first.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete performance validation, documentation, and final cross-story improvement work.

**Entry condition**: All user story implementation phases complete.

**Exit condition**: Feature passes performance tests, has documentation, and shared concerns are cleaned up.

- [ ] T032 [P] Add `README.md` documentation for environment setup and leave widget feature behavior.
- [ ] T033 [P] Add final validation of structured logging for leave request writes in `src/lib/logging.ts`.
- [ ] T034 [P] Add a reconciliation job stub in `src/server/reconciliation.ts` and document the 5-minute freshness strategy.
- [ ] T035 [P] Add end-to-end smoke test in `tests/e2e/leave-widget-smoke.spec.ts` covering the full dashboard interaction.
- [ ] T036 [P] Run `tests/performance/leave-read.pact.ts` with 20 leave types and 50 requests, verify p95 <= 500 ms.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: starts immediately.
- **Foundational (Phase 2)**: starts after Setup completion and blocks all user story work.
- **User Story phases**: start after Phase 2 completion.
- **Polish (Phase 6)**: starts after all user stories are implemented.

### User Story Dependencies

- **US1**: depends on foundational backend, auth, caching, and logging.
- **US2**: depends on US1 form and server validation shape, but remains independently testable.
- **US3**: depends on US1 read path and request listing, but remains independently testable.

### Parallel Opportunities

- Phase 1 tasks T001-T006 can run in parallel.
- Phase 2 tasks T007-T014 can run in parallel wherever they touch separate files.
- P1 test tasks T015-T017 can run in parallel with P1 implementation tasks after core read path exists.
- P2 and P3 story work can begin in parallel once foundational infrastructure is available.

---

## Coverage Map

| Functional Requirement | Tasks |
|---|---|
| FR-001: Display leave types and balances | T018, T019, T023 |
| FR-002: Submit leave request using `type`, `from-date`, `to-date` | T019, T020, T023 |
| FR-003: Display last 5 leave requests in descending order | T018, T019, T030, T031 |
| FR-004: Show `Pending` status after successful submission | T020, T023 |
| FR-005: Validate `from-date` <= `to-date` | T013, T017, T021, T027 |
| FR-006: Show insufficient balance error | T010, T020, T022 |
| FR-007: Show transient failure error and allow retry | T020, T022, T028 |

---

## Notes

- The explicit performance task T036 validates the p95 NFR using the real dataset bounds from the plan: 20 leave types and 50 historical requests.
- Test tasks are included for the P1 story and for the main validation/summary behaviors.
