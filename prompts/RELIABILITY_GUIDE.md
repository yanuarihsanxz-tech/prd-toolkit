# Universal PRD Reliability Guide

Use this guide when creating or reviewing a PRD that must be implementation-
ready, verifiable, and resistant to repeated trial-and-error. It is a
reference for the generator and agent skill, not a mandatory extra top-level
PRD section. Place applicable content in the existing template sections.

## Format Policy

- Write agent instructions in Markdown.
- Use YAML frontmatter for PRD/skill metadata that must be machine-readable.
- Use YAML for small configuration examples and JSON for API or event payloads.
- Use Mermaid for diagrams.
- Keep prose for rationale and decisions; keep schemas, thresholds, and
  acceptance criteria structured.
- Do not convert the entire prompt to YAML. YAML is poor for long conditional
  instructions and makes review harder.

## Non-Degradation Rule

For every proposed PRD change:

1. Name the ambiguity, risk, defect, or evidence gap it fixes.
2. Preserve approved product intent, safety boundaries, and compatibility.
3. Prefer one precise, testable requirement over generic best-practice text.
4. Reject complexity that does not add measurable clarity, safety, or evidence.
5. Never invent a business decision, credential, integration, API, threshold, or
   runtime fact.
6. If evidence is missing, mark the claim `UNVERIFIED` and record what would
   verify it.

## Evidence Hierarchy

At the start of a review, identify the authoritative source for each claim:

1. Non-negotiable safety and security constraints.
2. Explicitly approved owner decisions.
3. Current authoritative PRD and repository instructions.
4. Current schemas and public compatibility/provider contracts.
5. Current repository implementation.
6. Current tests and fixtures.
7. Source-state-bound runtime or validation receipts.
8. Architecture, operations, handoff, and progress documents.
9. Historical conversation, screenshots, and summaries.
10. Assumptions and assistant inference.

When sources conflict, record both claims, select the authority using this
hierarchy, and log the correction. Never silently choose a business policy.
Historical evidence can explain why a requirement exists but cannot prove the
current implementation or runtime. At every resumed milestone, record the
current task, source fingerprint, approved decisions, superseded sources, and
next permitted action before editing.

## Reliability Contract

Upgrade feature prose into an implementation and verification contract. For
each important capability, define:

- stable requirement ID (`FR-###` or `NFR-###`);
- preconditions, trigger, main path, alternate path, and failure path;
- persisted state and user/operator-visible result;
- allowed and forbidden external side effects;
- measurable acceptance criteria with stable `AC-###` IDs;
- implementation location and evidence required to mark it complete.

Traceability is two-way: every capability must map to its applicable
requirements and acceptance criteria, and every `FR-###`, `NFR-###`, and
`AC-###` must map back to a capability, implementation surface, milestone, and
required evidence. Do not treat a row count or non-empty matrix as proof of
coverage; verify ID uniqueness and set equality in both directions.

Every stateful or externally connected feature must additionally define:

- legal and illegal state transitions;
- restart and recovery behavior;
- duplicate and concurrent request behavior;
- timeout, retry, and uncertain-outcome behavior;
- observability and safe fallback.

### Authority and Mode Contract

For multi-component or safety-sensitive systems, define an authority matrix:

| Component/role | May observe | May advise/veto | May mutate | May execute externally | Must never override |
|---|---|---|---|---|---|
| [Component] | [Scope] | [Scope or N/A] | [Scope or none] | [Scope or none] | [Invariant/owner] |

Define a mode-to-side-effect matrix for every preview, dry-run, shadow,
read-only, staging, and production mode. Include durable local writes,
notifications, provider calls, destructive actions, asset/money movement, and
required operator authorization. A safe mode may preserve explicitly required
evidence, but it must not use a forbidden execution path. “Read-only” means no
mutation; it does not mean zero CPU, I/O, network, or provider impact.

Probabilistic advisors and source producers are non-authoritative unless an
explicit owner decision states otherwise. Missing, malformed, stale,
unavailable, or contradictory advisory output must not grant permission or
weaken a deterministic safety rule.

## Safety Invariants

List invariants that must remain true in every applicable mode, then give each
one at least one negative test. Typical invariants include:

- validation failure prevents side effects;
- secrets never enter source, fixtures, logs, or reports;
- uncertain external outcomes are not blindly retried;
- read-only modes cannot perform writes;
- partial operations are rolled back or visibly quarantined;
- failures cannot produce false success messages;
- destructive actions require explicit authorization.

Do not claim an invariant is proven from a source-text search alone.

## External and Data Contracts

For every external provider or producer-consumer boundary, specify:

| Contract field | Required detail |
|---|---|
| Identity | Provider, endpoint/command, version, schema version |
| Data | Required/optional fields, types, enums, units, ranges |
| Semantics | Missing/null behavior, normalization, provenance, timestamps |
| Freshness | Maximum age, future timestamps, clock skew, stale-data action |
| Reliability | Timeout, rate limit, retry/backoff, idempotency, error mapping |
| Compatibility | Version policy, backward compatibility, rejection behavior |
| Evidence | Official source or sanitized real fixture, contract tests |

For provider status, use a proof ladder instead of one Boolean:

1. `CONFIGURED` — configuration is present and syntactically valid;
2. `AUTHENTICATED` — credentials were accepted;
3. `ROUTE_VERIFIED` — the required route succeeded with a valid response;
4. `CORE_FLOW_VERIFIED` — the complete core path succeeded;
5. `OPTIONAL_DEGRADED` — optional routes failed without disproving core health;
6. `RATE_LIMITED` or `COOLDOWN` — retry is forbidden until the recorded time;
7. `UNAVAILABLE` — the required route cannot currently be used;
8. `DATA_STALE` — a value exists but is outside its trust window.

Configuration presence, a provider/model catalog, or one generic health call is
not proof that the required route is available. Record the tested route,
provider observation time, failure category, retry eligibility, and source-state
receipt. Separate core and optional-route health.

For rate-limited providers, define retry ownership, shared cooldown scope,
`Retry-After` handling, concurrency, priority, circuit breaking, and attempt
records. One unavailable provider must not trigger one immediate retry per
queued item. Rate limiting, timeout, and provider error are never success.

For producers and consumers, separate immutable event ID, payload hash,
producer signal ID, business identity, and merge/idempotency scope. Preserve
distinct source receipts while transactionally preventing duplicate downstream
work. Reusing an event ID with different content is a conflict, not a replay.
Advisory source qualification never replaces authoritative consumer validation.

Preserve raw provider values before normalization when unit or meaning can be
ambiguous. Similar field names do not prove identical units. Ambiguity in a
safety-critical value must fail closed unless an owner decision says otherwise.

For every important metric or calculation, define the formula, numerator,
denominator, unit, baseline, time window, timezone, precision, rounding,
inclusions, exclusions, missing/stale-data behavior, restart behavior, and
boundary examples.

For observed time series, distinguish poll time, request start/end, provider
observation time, data age, latency, sequence, and whether the response contains
new data. A fast poll loop cannot claim equally fresh source data when the
provider timestamp did not change. Count or suppress duplicate provider
timestamps according to an explicit policy.

For notifications, persist the business event and decision independently from
delivery. Delivery has separate configuration, idempotency, retries, and status.
Muting a channel must not erase source evidence, and safe/test operation must
not contact real recipients unless explicitly authorized.

## State, Idempotency, and Time

Document a state model for jobs, signals, notifications, exports, reports, or
events when they persist across operations. Include states such as detected,
persisted, pending, processing, succeeded/exported, failed, retryable,
rejected, and reconciled only when applicable.

For each state-changing or external operation, define:

- intent creation and attempt start;
- confirmed success and confirmed failure;
- uncertain result and reconciliation;
- retry permitted/forbidden;
- duplicate detection and idempotency-key scope;
- terminal state and operator recovery.

Separate immutable events, authoritative mutable state, derived aggregates,
historical state, and UI/API projections. Every displayed state must map to an
authoritative field or documented derivation with scope and timestamp. Do not
repair a projection bug by rewriting historical evidence. Migration contracts
must explicitly allow or forbid backfill, merge, delete, and historical rewrite.

Durable running work requires an owner/lease or heartbeat, stale threshold,
safe recovery rule, attempt count, and terminal reason. Reconcile supervisor,
PID, port, process, database state, and health before claiming a service or run
is active. Define session start/end triggers, carry-over behavior, and whether
metrics are current-session, carry-over, or all-time.

For rolling or historical windows, define inclusive/exclusive boundaries,
start/end calculation, zero/one-event behavior, maximum gap, downtime, old
history, timezone, clock skew, and future timestamps. Add positive and negative
boundary tests.

For schedulers, also define alignment, atomic claim identity, deadline origin,
work duration, cancellation, cleanup duration, total wall time, release of
locks/queues/child processes, and whether the next eligible slot can proceed.
A timed-out operation must retain its precise reason and cannot be marked
successful merely because cleanup completed.

Separate authoritative outcomes from hypothetical simulations, variants,
watchlists, and tracking-only observations. Analytics may consume authoritative
observations, but cannot create permission, risk, external effects, or
authoritative outcome/P&L unless explicitly promoted by an owner decision.

Define detail retention separately for active detail, terminal detail, compact
summaries, provenance, and authoritative outcomes. Default interfaces must be
bounded and paginated/collapsible rather than returning unbounded history.

## Mock and Fixture Standards

A mock is valid only if it preserves the production property under test.
Document what it models and intentionally omits, including shape, timing,
headers, pagination, errors, persistence, authentication, concurrency, and
process behavior when relevant.

Fixtures must cover valid, invalid, missing, null, zero, negative, boundary,
malformed, stale, ambiguous, and adversarial inputs as applicable. Compare
important mocks with at least one sanitized real example.

## Environment and Failure Classification

Specify the required environment for each verification. At minimum distinguish:

| Category | Meaning |
|---|---|
| `REQUIREMENT_AMBIGUOUS` | Product behavior or owner decision is missing |
| `CODE_FAILED` | Implementation violates a known requirement |
| `TEST_FAILED` | Test exposes a reproducible defect |
| `TEST_FLAKY` | Race/timing-sensitive result is not stable |
| `MOCK_INVALID` | Test double does not preserve the production property |
| `CONTRACT_UNVERIFIED` | External behavior lacks current evidence |
| `SCHEMA_MISMATCH` | Producer and consumer contracts disagree |
| `DATA_STALE` | Value exists but exceeds its trust window |
| `ENVIRONMENT_BLOCKED` | Sandbox, permission, OS, network, or dependency prevents proof |
| `EXTERNAL_DEPENDENCY_FAILED` | Provider or service failed |
| `CONFIGURATION_INACTIVE` | Capability is configured but not enabled/exercised |
| `OPERATOR_DECISION_REQUIRED` | Safe progress requires explicit owner choice |
| `EVIDENCE_STALE` | Evidence belongs to an older source, config, or runtime state |
| `OPERATIONAL_STATE_STALE` | Persisted/displayed lifecycle state disagrees with host/process reality |
| `RESOURCE_BUDGET_EXCEEDED` | Runtime, audit, query, payload, or refresh violates its declared budget |

Do not “fix” an environment restriction by weakening application safety. Record
the blocked check, authorized environment needed, and remaining uncertainty.

## Verification Receipt

Every significant completion claim should have a secret-free receipt:

```json
{
  "claim": "Observable behavior proven",
  "scope": "unit|integration|contract|host_smoke|safe_runtime|acceptance",
  "command": "Sanitized command or procedure",
  "working_directory": "/absolute/path",
  "environment": "sandbox|integration|host|production_read_only",
  "started_at": "UTC ISO-8601",
  "finished_at": "UTC ISO-8601",
  "exit_code": 0,
  "result_summary": "Counts and key assertions",
  "source_state": "Secret-free manifest or fingerprint",
  "limitations": [],
  "artifacts": []
}
```

Tie evidence to the exact source state. A material edit invalidates affected
verification until the relevant checks are rerun. If Git is not authorized,
use a local secret-free manifest of paths, sizes, modification times, and
SHA-256 hashes.

Use precise completion vocabulary: `edited`, `implemented`, `statically
checked`, `unit verified`, `integration verified`, `deployed`, `running`,
`exercised`, and `accepted` are different claims. State which claim the receipt
proves. Include expected side effects, observed side effects, cleanup, and a
post-check for forbidden side effects when relevant.

### Controlled Runtime Smoke

Before a host smoke, define:

- authorization, exact working directory, interpreter/runtime, configuration,
  safe mode, port, and dependency access;
- preflight process/session/dirty-tree checks and expected source fingerprint;
- bounded duration, success/failure assertions, resource budget, and artifacts;
- forbidden side effects and how their absence will be checked;
- shutdown/cleanup ownership and postconditions;
- exactly one operator next action after the result.

Do not start a duplicate process or run a smoke while a materially different
source state is already active. If no action is required, explicitly say so and
name the next observation gate instead of printing a start command.

### Stateful UI/API Projection Smoke

When a dashboard or client renders persisted or API-backed state, include a
bounded browser smoke matrix for the applicable response shapes:

- a complete current record;
- a normal completed historical record;
- a partial, interrupted, legacy, or otherwise missing-nested-field record;
- empty, null, and error responses where the interface supports them.

The smoke must assert that the built artifact mounts, exposes the intended
empty/error or partial state, produces no uncaught browser exception, and can
navigate between current and historical views without losing the safety or
authority boundaries of the data. Static typecheck/build results and HTTP
`200` responses alone do not prove this contract: compile-time types do not
validate persisted JSON at runtime. Normalize or validate external/persisted
payloads at the API boundary, or render an explicit partial state; never let a
missing optional nested field blank the entire interface. Record the exact
artifact/source state and classify failures as `SCHEMA_MISMATCH`, `CODE_FAILED`,
`TEST_FAILED`, or `ENVIRONMENT_BLOCKED` as applicable.

## Test Strategy

### Evidence Quality

For a behavior claim, identify the initial state, action, expected result and
observed result. Assert the outcome named by the AC: a preset must load the
expected values, export/import must preserve defined data, and a calculation
must match independently specified examples or invariants. A control's presence
only proves its presence. A changed page does not prove correct recalculation.

Treat missing selectors, unavailable prerequisites and unexercised branches as
UNVERIFIED or explicit skips, never automatic passes. Distinguish a test locator
failure from a product defect by inspecting actual behavior. Do not make a
particular button wording mandatory unless the product requires it. Report
assertion coverage and skipped/blocked checks alongside pass counts; 12/12 checks
is not 100% product correctness or a security guarantee.

Use isolated test data and restore test-created state. Distinguish caught
diagnostic logs, uncaught errors and user-visible failures. Preserve useful
diagnostics; test recovery and data integrity instead of requiring silence.

For comparative evaluations, hold brief, model, effort, tools, environment and
acceptance criteria constant where possible; record differences and exposure to
the other implementation. Define the checks before judging results. Count PRD
preparation, clarification, implementation, verification and rework in total
elapsed time. Report measured token usage separately when available; elapsed
time or document bytes do not establish token cost. A single pair of runs is
exploratory evidence, not proof of a general causal improvement or saving.

Select only categories relevant to the project, and specify environment,
external access, timeout, expected evidence, and cleanup:

- static/source checks;
- unit and property/boundary tests;
- schema, migration, database, and persistence tests;
- provider contract and malformed-response tests;
- integration and behavioral execution tests;
- retry, idempotency, timeout, crash-recovery, and restart tests;
- concurrency/race tests;
- security and secret-scan tests;
- UI build/type-check tests;
- bounded safe-mode smoke tests;
- host operational checks for startup, health, ports, logs, shutdown, and cleanup.

### Progressive Verification Budget

Verification depth follows the evidence boundary, not the number of files
edited:

1. During one delivery slice, run syntax/static checks and the smallest focused
   tests needed for fast feedback.
2. At slice completion, run the targeted behavioral or integration checks that
   prove that slice's acceptance criteria.
3. In the final integrated audit, run the full applicable regression and real
   behavioral/manual product test across completed slices. Fix in-scope defects
   discovered there and rerun the affected evidence before handoff.
4. Run production, destructive, financial, externally visible, or final owner
   acceptance checks only under their separate authority gates.

Do not rerun the full repository suite after each internal file, component, or
code-layer step. Conversely, do not use targeted slice checks as a substitute
for the final cross-cutting audit.

Verification and observability have resource budgets too. Declare limits for
CPU, memory, disk I/O, database rows/pages scanned, payload size, refresh
frequency, history replay, external requests, and wall time when relevant.
Frequent health endpoints must use bounded checks; deep integrity checks must be
separate, deliberate, attributable, and rate-limited. Optional analytics,
notification formatting, and audits must not starve critical/core work.

Race-sensitive suites must pass at least three consecutive times after the final
related edit. Investigate unexpected runtime increases; do not rerun until green
without understanding the cause.

## Readiness and Definition of Done

Use an explicit level instead of an unqualified “ready”:

| Level | Evidence |
|---|---|
| 0 — Requirements documented | Requirements, scope, and acceptance criteria exist |
| 1 — Unit verified | Pure logic, parsing, and validation pass |
| 2 — Integration verified | Persistence, adapters, contracts, and retries pass |
| 3 — Host operationally verified | Real startup, health, lifecycle, ports, logs, cleanup pass |
| 4 — Safe non-production ready | Dry-run/preview/sandbox/read-only behavior is proven |
| 5 — Non-production qualified | Duration, scenarios, reliability, and continuity gates pass |
| 6 — Production acceptance eligible | Authorization, recovery, rollback, monitoring, and security pass |
| 7 — Production activated | Separate explicit operator action has occurred |

Completion must not be claimed from prose alone, an earlier source state, one
race-sensitive run, a source-string check, a PID file, or configuration presence.
Every report must name the achieved level, exact evidence, environment,
permissions, dependency versions, real-vs-mocked coverage, remaining risks, and
unverified items. Production activation is never implied by documentation or
autonomous agent work.

An operator handoff must state the observed current state, exactly one next
action, its preconditions, expected result, and what not to do. Do not present a
command that contradicts the prose or requires the operator to infer whether a
service is already running.

## Safe PRD Review Workflow

1. Read the complete current PRD and applicable repository instructions.
2. Inspect the working tree and preserve pre-existing changes; record the files
   in scope and a secret-free source-state manifest.
3. Inspect implementation, tests, contracts, configuration, operations, and
   current status.
4. Build a conflict/gap inventory and classify every gap.
5. Preserve stronger existing requirements; add only justified improvements.
6. Update relevant existing sections and the traceability/evidence matrix.
7. Re-read changed sections, validate links/commands/terminology, and scan for
   secrets.
8. Report current readiness, target readiness, open decisions, blocked checks,
   and evidence still required.

Do not create a reliability postmortem without factual incident evidence. If
history is unavailable, record `UNVERIFIED` and keep the item as an open
decision or verification task.
