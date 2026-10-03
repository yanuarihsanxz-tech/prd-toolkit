# PRD Toolkit Documentation Index

This is the canonical documentation router. It identifies the owner and purpose
of each document so onboarding, policy, operation, historical evidence, and
archive material are not confused.

## Authority Order

When two sources appear inconsistent, apply this order:

1. `AGENTS.md` — repository instructions loaded by Codex.
2. Explicit owner approvals recorded in root `DECISIONS.md` and `PROGRESS.md`.
3. `PROJECT_CONTEXT.md` — canonical toolkit architecture and standards.
4. Current schemas, prompts, templates, layouts, scripts, and tests.
5. `BASELINE.md` and `CHANGELOG.md` — version contract and change history.
6. Onboarding and contribution documentation.
7. Generalized design lessons and archived documentation.

Historical or archived material may explain why a rule exists, but it cannot
override a current accepted decision or prove current implementation/runtime
state.

## Choose By Task

| Need | Start here | Continue with |
|---|---|---|
| Use the toolkit folder | [root skill](../SKILL.md) | Only the operation requested by the user |
| Understand or maintain the toolkit | [README](../README.md) | [canonical context](../PROJECT_CONTEXT.md) |
| First local use | [Getting Started](GETTING_STARTED.md) | [layout router](../layout/INDEX.md) |
| Prepare a separate Git checkout | [Distribution](DISTRIBUTION.md) | Clean export, portable paths, CI and publication limits |
| Inspect Git preparation evidence | [Git readiness audit](../evals/git-readiness-2026-09-27.md) | Reproduced defects, repairs, local verification and hosted-test limits |
| Brainstorm and research before a PRD | Current conversation, then [Generate layout](../layout/GENERATE_PRD.md) | Use the [Discover layout](../layout/DISCOVER_PRODUCT.md) only for durable cross-conversation evidence |
| Generate a PRD | [Generate layout](../layout/GENERATE_PRD.md) | [generator prompt](../prompts/PRD_GENERATOR_PROMPT.md) and selected template |
| Understand the final product handoff | [Worked handoff](../examples/prd-handoff-example.md) | Generator's Owner Summary And Product Flow contract and read-only preview command |
| Validate a PRD | [Validate layout](../layout/VALIDATE_PRD.md) | [structural validator](../scripts/validate-prd.mjs) and [validation checklist](../prompts/PRD_VALIDATION_CHECKLIST.md) |
| Specify or review an existing-product change/bug | [Change contract](CHANGE_CONTRACT.md) | [comparison CLI](../scripts/compare-prd.mjs), stable IDs and retirement review |
| Migrate authority format | [Authority policy](AUTHORITY_POLICY.md) | Optional v1 field, exact normalized block and legacy rules |
| Improve reliability | [Improve layout](../layout/IMPROVE_PRD.md) | [reliability guide](../prompts/RELIABILITY_GUIDE.md) |
| Research a current dependency or choose an optional tool | [research and tool routing](../prompts/RESEARCH_AND_TOOL_ROUTING.md) | official primary sources and the target repository |
| Generate an explicitly requested stateful runner plan | [Generate Tasks layout](../layout/GENERATE_TASKS.md) | [task-plan schema v2](../schemas/task-plan.schema.json) |
| Build a completed PRD through its local milestones | [Execute Tasks layout](../layout/EXECUTE_TASKS.md) | Native progress by default; runner guide only for requested/existing runner mode |
| Audit implemented code against the complete PRD | [Implementation Audit layout](../layout/AUDIT_IMPLEMENTATION.md) | target source, tests, runtime evidence, and task state |
| Extend the toolkit | [Contributing](CONTRIBUTING.md) | relevant contract and tests |
| Use the toolkit through Reasonix | [Reasonix adapter](REASONIX_ADAPTER.md) | canonical layouts and target repository instructions |
| Inspect 3.2.0 verification evidence | [Local verification](../evals/release-3.2.0.md) | Fresh deterministic checks and historical handoffs; current publication is in PROGRESS.md |
| Inspect version compatibility | [Baseline](../BASELINE.md) | [Changelog](../CHANGELOG.md) |
| Inspect the tested two-conversation handoff | [Forward-test report](../evals/forward-test-report.md) | Scenario, observed evidence, and limitations |
| Inspect instruction-size efficiency changes | [Efficiency rework](../evals/efficiency-rework-2026-09-12.md) | Before/after reading sets, compact-handoff checks, and usage measurement limits |
| Inspect design lessons | [Conversation lessons](CONVERSATION_TO_UNIVERSAL_PRD_LESSONS.md) | accepted root decisions |
| Archive superseded documentation | [Archive policy](archive/README.md) | [Changelog](../CHANGELOG.md) and root decisions |

## Document Ownership

| Document | Classification | Owns | Must not own |
|---|---|---|---|
| `README.md` | Overview | Purpose, quick routing, core commands | Detailed policy or historical ledger |
| `docs/GETTING_STARTED.md` | Onboarding | First-use procedure | Canonical architecture decisions |
| `PROJECT_CONTEXT.md` | Canonical contract | Architecture, standards, authority | Step-by-step tutorial detail |
| `AGENTS.md` | Agent instruction | Required routing and safety | Product-specific decisions |
| `SKILL.md` | Agent entry | Intent routing and progressive context loading | Duplicated mode-specific procedures |
| `prompts/SKILL.md` | Compatibility adapter | Route existing references to root SKILL.md | A second workflow or runner duplication |
| `prompts/RESEARCH_AND_TOOL_ROUTING.md` | Lifecycle research and conditional integration policy | Phase tool map, primary-source, optimizer benchmark, key, and setup routing | Host credential values or mandatory dependencies |
| `layout/DISCOVER_PRODUCT.md` | Discovery operation | Target `DISCOVERY.md` evidence and PRD-handoff contract | Product requirements or application implementation |
| `layout/AUDIT_IMPLEMENTATION.md` | Conformance operation | Target `IMPLEMENTATION_AUDIT.md` evidence and readiness boundary | Code repair, product requirements, deployment, or owner acceptance |
| `docs/CONTRIBUTING.md` | Maintenance | Change procedures and required validation | User onboarding duplication |
| `docs/REASONIX_ADAPTER.md` | Optional agent adapter | Reasonix activation, seven-command mapping, efficiency, authority, pause, summary, and evidence boundaries | PRD structure, runner semantics, provider setup, or target-project state |
| `BASELINE.md` | Version contract | Compatibility and release procedure | Claims of publish/deploy/runtime state |
| `CHANGELOG.md` | Change history | Versioned notable changes | Current governance state |
| `DECISIONS.md` | Toolkit governance | Accepted/proposed toolkit decisions | Target-project decisions |
| `PROGRESS.md` | Toolkit governance | Toolkit milestone state and evidence | Target-project progress |
| `evals/forward-test-report.md` | Bounded evaluation evidence | Isolated handoff scenario, results, source identities, and limits | Universal quality, runtime, or cost guarantees |
| `docs/CONVERSATION_TO_UNIVERSAL_PRD_LESSONS.md` | Design rationale | Generalized lessons, abstraction, accepted contracts | Current runtime proof |
| `docs/archive/` | Historical archive | Superseded documentation with provenance | Current canonical instruction |

## Duplication Rule

One fact has one owning document. Other documents link to it and may provide a
short task-specific summary, but they must not establish an alternative policy.
When a change affects multiple consumers, update the owner first, then update
routing references and automated consistency checks.

## Governance Locality

Root `DECISIONS.md` and `PROGRESS.md` govern this toolkit only. Every generated
target project initializes and maintains its own files from
`templates/project-decisions.md` and `templates/project-progress.md`.

## Archive Route

Do not silently delete or overwrite superseded documentation. Follow
`docs/archive/README.md`, preserve provenance and replacement links, update the
changelog, and rerun the complete toolkit validation.
