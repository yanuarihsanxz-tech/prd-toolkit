# PRD Toolkit — Canonical Project Context

## Purpose

The PRD Maker converts a resolved product conversation into one self-contained
PRD, then supports a fresh coding conversation that implements and verifies it.
It is a files-only toolkit, not an agent runtime, installer, or model provider.
The user's current operation controls scope. Research-only does not create a
PRD; generating a PRD does not authorize a build.

The default entry is specification-only: a short invocation consumes resolved
context and supplies validation, summary and product flow automatically. Explicit
analysis-only intent is read-only. New/rework/bug-fix describes the specification's
scope, not an instruction to modify application code. Build utilities remain
available only through separate explicit requests.

The toolkit coordinates early product definition. It identifies specialist
capabilities and evidence needed for the target product, then records routes for
a separately authorized builder. It does not bundle UI/UX, security, research,
browser automation or other specialist runtimes. The agent checks actual host
availability and records an equivalent route or an unresolved gap.

## Entry And Ownership

[SKILL.md](SKILL.md) is the folder entry. Read it and only the selected operation.
[AGENTS.md](AGENTS.md) governs toolkit work; [docs/INDEX.md](docs/INDEX.md) owns
maintenance and documentation routing. `prompts/SKILL.md` is a compatibility shim.

| Surface | Owns |
|---|---|
| `prompts/PRD_GENERATOR_PROMPT.md` | Generation, applicability, handoff content, and quality gates |
| `templates/full.md`, `templates/lite.md` | 10-section app and 6-section tool output shapes |
| `layout/` | Single-purpose operation entry points; no second methodology |
| `prompts/PRD_VALIDATION_CHECKLIST.md` | Product judgment, evidence, and bounded scoring |
| `prompts/RELIABILITY_GUIDE.md` | Conditional state, authority, failure, and verification detail |
| `prompts/RESEARCH_AND_TOOL_ROUTING.md` | Current-source research and optional-tool adoption |
| `scripts/validate-prd.mjs` | Generated-PRD structural preflight |
| `scripts/preview-prd.mjs` | Read-only extraction of the saved human overview and product flow; no generation or runtime claim |
| `scripts/validate-toolkit.mjs`, `tests/`, `evals/` | Toolkit consistency, unit/CLI checks, representative regressions |
| `schemas/` | PRD metadata, regression manifest, optional runner plan/state contracts |
| `layout/EXECUTE_TASKS.md` | Native default build and runner selection |
| `prompts/PHASE_GATED_TASK_RUNNER.md`, `scripts/local-task-runner.mjs` | Optional fingerprint-bound execution, attempts, failure, recovery |
| `layout/AUDIT_IMPLEMENTATION.md` | Exhaustive source-bound conformance report |
| `.reasonix/`, `docs/REASONIX_ADAPTER.md` | Optional runtime adapter; no installation or provider assumption |
| Root `DECISIONS.md`, `PROGRESS.md` | Toolkit history only; targets own their own governance |
| `package.json`, `BASELINE.md`, `CHANGELOG.md` | One local version contract, not proof of publication |

## Product Contracts

1. Keep the PRD self-contained. Carry selected scope, exclusions, rationale,
   assumptions, build-relevant research conclusions, interfaces, state/failures,
   prerequisites, and verification paths. Optional DISCOVERY.md owns durable
   time-sensitive evidence, not requirements that the builder cannot otherwise see.
2. Use stable, unique FR-###, NFR-###, AC-### IDs with two-way traceability to
   capabilities, implementation surfaces, milestones, and required evidence.
3. Use Full for user-facing apps, Lite for tools/automations/API-only systems.
   Preserve 10/6 top-level sections; scale detail to actual needs. Do not impose
   arbitrary feature/metric/test counts or the toolkit's architecture on products.
4. Distinguish human outcomes and machine contracts without duplicating prose.
   Use selective EARS wording where a condition/trigger improves testability.
5. Put the Builder Capability Routing Contract inside Architecture. New PRDs
   point ai_instructions to that embedded subsection. Name tools only as available
   preferences; the builder inspects its host, reads matching instructions, and
   records route/fallback evidence in its existing progress/plan and audit.
6. Fallbacks preserve acceptance criteria and authority. Mock/static evidence
   never proves required live behavior. Missing required checks remain UNVERIFIED
   and prevent a completion claim for the dependent outcome.
7. New PRDs start draft at milestone 0. During a build, status is implementation
   and current_milestone records the highest sequentially verified milestone;
   it never exceeds total_milestones. Approved remains an explicit owner verdict.
8. Use Markdown for narrative, YAML for metadata/config, JSON for data contracts,
   and Mermaid for diagrams. Never store credentials in these artifacts.
9. Define requirements, acceptance criteria, and milestone outcomes once in the
   PRD; use IDs/local references elsewhere. PROGRESS.md holds live evidence and
   resume deltas rather than another specification. One meaningful Mermaid can
   cover architecture and flow; additional diagrams require distinct information.
   Select reliability applicability per risk/control, not by requiring every
   enterprise control whenever a product stores data. No fixed reasoning ritual,
   diagram quota, invented infrastructure, or per-file whole-project rescan.
10. Generation ends with an owner-facing explanation and the saved product
    flowchart in the conversation language. The generator owns this delivery
    contract; the PRD owns the diagram. No extra target summary file is required.

## Execution And Authority

Native is the default for a new local build: the active coding host's plan and
target PROGRESS.md hold 2-3 outcome milestones including the integrated audit.
An explicit build request authorizes scoped local implementation, tests, in-scope
fixes, and ordinary milestone continuation. Show the compact plan and continue.
Do not create TASKS.json, a second plan document, or runner state by default.

Runner mode is opt-in or retained when a toolkit plan/state already exists.
Its v2 schemas, exact-fingerprint approval, ordering, locks, preserved attempts,
plan-wide failure block, and PLAN_CHANGED invalidation remain unchanged. No
native fallback bypasses managed state. Read the runner guide fully in that mode.

In either mode, four milestones need independent outcomes; five is exceptional.
Deliver something runnable early, complete the connected product, and perform
one final integrated audit with full applicable regression, real user-path
checks, in-scope repairs, and rerun evidence. Material scope changes and uncovered
external, destructive, paid, credential, deployment, production, and acceptance
actions remain explicit authority boundaries. Do not impose numerical approval
budgets on genuine risks or invent approvals from a document.

## Evidence And Completion

Structural checks prove only named structural properties. Product truth,
feasibility, runtime, deployment, and acceptance are separate evidence levels.
Every final implementation audit covers every FR/NFR/AC using current source and
actual checks. A mocked integration or an unrun procedure cannot close live scope.
Stop at verified local completion or a concrete blocker after useful authorized
work is exhausted; do not end at a scaffold, compile, or passing syntax check.

Version changes follow BASELINE.md. Root logs preserve history and do not infer
owner acceptance, Git tags, external publication, deployment, or production state.
