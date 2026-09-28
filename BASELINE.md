# PRD Toolkit Version Baseline

This document defines the local repository contract for the PRD Toolkit. It is
not evidence of a Git commit, tag, npm publication, deployment, or production activation.
Toolkit acceptance remains governed by `PROGRESS.md`.

## Baseline Identity

| Field | Value |
|---|---|
| Name | PRD Toolkit |
| Package | `prd-toolkit` |
| Version | 3.1.2 |
| Baseline date | 2026-09-27 |
| Distribution | Files-only toolkit prepared for public Git distribution |
| Runtime | Node.js `>=20.0.0`; no installed package dependency required |
| Evidence level | Level 1 — unit-verified structural contracts only |
| Separate behavioral evidence | One isolated Lite CLI generation/build trial; see evals/forward-test-report.md for its scope and limits |
| Canonical documentation index | `docs/INDEX.md` |
| Change history | `CHANGELOG.md` |

## Contract Versions

| Contract | Version | Compatibility rule |
|---|---:|---|
| Toolkit package baseline | `3.1.2` | Follows the toolkit version policy below. |
| PRD frontmatter schema | `1` | Breaking metadata changes require a new schema identifier. |
| Generator regression manifest | `1` | Breaking case-manifest changes require `schema_version` increment. |
| Task plan | `2` | v1 evidence is historical and is never silently upgraded. |
| Task state | `2` | v1 evidence is historical and is never reinterpreted as v2. |
| Full PRD structure | 10 sections | Breaking section changes require a toolkit major version. |
| Lite PRD structure | 6 sections | Breaking section changes require a toolkit major version. |

Schema versions are independent from the toolkit package version. A toolkit
release may preserve existing schema versions when it changes only compatible
documentation, routing, tests, or implementation details.

## Baseline Capabilities

Version `3.1.2` includes:

- Full and Lite PRD generation contracts;
- canonical metadata, stable IDs, and two-way traceability;
- conditional reliability, authority, provider, state, resource, and evidence
  contracts;
- deterministic generated-PRD and whole-toolkit validation;
- schema-governed representative generator regressions;
- task-plan/state schema v2 and fingerprint-bound fail-closed execution;
- native planning and PROGRESS.md for new local builds, authorized by the user's
  explicit build request; no second ordinary approval or runner artifacts;
- optional runner mode with exact plan approval, retained automatically for
  existing toolkit plans/state; no bypass of failures or approval invalidation;
- product-first planning with two or three milestones by default, four only
  with justification, and five as an exceptional hard ceiling;
- an early runnable or visibly testable product outcome before system
  completion, followed by one final integrated qualification audit;
- progressive verification with targeted implementation checks and one final
  full applicable regression plus real behavioral/manual product test;
- automatic continuation across phase, layer, component, and milestone labels
  without synthetic checkpoints;
- complete per-milestone summaries covering outcome, changes, trial path,
  verification, limitations, progress, and next action;
- builder-authorized safe in-scope local retry while preserving the failed
  attempt and requiring owner input for new scope, authority, or external state;
- conditional primary-source research, optional-tool, credential, and external
  orchestration routing without adding a core dependency;
- toolkit-versus-target-project governance separation;
- documentation ownership, archive routing, and change history.
- a dependency-free Reasonix command adapter for discover, generate, validate,
  improve, task-plan, execute, and implementation-audit operations;
- local minimality and efficient-handoff guardrails that preserve complete PRD,
  evidence, safety, and failure contracts without installing external workflow
  skills.
- an evidence-aware discovery operation and Reasonix command that persist one
  concise `DISCOVERY.md` handoff before PRD generation;
- selective EARS-style acceptance wording for observable event, state, fault,
  optional-feature, and timing behavior without imposing a second spec format;
- an exhaustive implementation-conformance audit and Reasonix command that map
  every FR/NFR/AC ID to current source, test, and runtime evidence in
  `IMPLEMENTATION_AUDIT.md`;
- phase-specific optimizer policy: repository-native tools first, RTK only
  after a measured noisy-output benchmark, and Headroom/Superpowers outside the
  core workflow.
- direct conversation-to-PRD generation after brainstorming and research;
  `DISCOVERY.md` is optional rather than a mandatory ceremony;
- a mandatory Builder Capability Routing Contract inside every generated PRD,
  mapping triggers to required capabilities, preferred callable skills/tools,
  repository-native fallbacks, evidence, and authority for a fresh builder
  conversation;
- deterministic rejection of missing, misplaced, commented/fenced, malformed,
  or unresolved builder routing, including availability instructions scoped to
  that contract; actual tool availability and fallback equivalence still
  require builder inspection;
- visible builder startup guidance and a fresh-conversation handoff review,
  with unchanged acceptance evidence for fallback routes.

## Owner Summary And Preview

Version 3.1.1 adds a readable owner summary, a product flowchart reused from the
PRD, and an optional read-only preview command. Full/Lite section counts, schema
versions and runner contracts remain compatible. The command requires a visible
flowchart for preview; sequence-only legacy PRDs still pass structural validation.

## Public Distribution

Patch 3.0.3 prepares MIT-licensed public source with generalized design history,
portable usage instructions and personal-path checks. Prior private development
material is retained outside the distributed toolkit. Git publication is a
separate observed event, not implied by this version number.

## 3.0 Migration Boundary

Patch 3.0.1 removes duplicate generation guidance, template plan copies, and
blanket reliability applicability. It preserves the 3.0 native/runner authority
contract, schemas, IDs, 10/6 sections, and complete evidence requirements.
See [efficiency evidence](evals/efficiency-rework-2026-09-12.md) for measured
instruction bytes and bounded tests; these are not billed-token guarantees.

The default execution/authorization workflow changes, so this is a major local
version. Full/Lite sections, stable IDs, frontmatter schema 1, and runner schemas
2 remain intact. New PRDs use a local heading anchor for ai_instructions and
embed native builder instructions. Historical path-style metadata remains valid.
An existing runner plan/state keeps its original recorded mode and exact
approval/failure rules; no automatic migration or reapproval fabrication occurs.
The legacy prompts/SKILL.md path forwards to root SKILL.md. No host installation,
credential setup, agent-runtime change, publication, or deployment is included.

## Version Policy

- **Patch** (`1.0.x`): compatible corrections, examples, documentation, finding
  clarity, and test coverage that do not weaken or change an approved contract.
- **Minor** (`1.x.0`): backward-compatible capabilities, layouts, checks, or
  optional contracts.
- **Major** (`x.0.0`): breaking template structure, CLI semantics, governance,
  stable-ID rules, or compatibility expectations.
- A schema-breaking change also increments that schema's own identifier or
  `schema_version`, even when the toolkit major version changes.

## Required Baseline Checks

Run from `/absolute/path/to/prd-toolkit`:

```bash
npm run check
```

Equivalent dependency-free commands:

```bash
node scripts/validate-toolkit.mjs --json
node --test tests
```

A passing result proves only the declared structural and unit contracts. It
does not prove generated-product factual correctness, target-project
implementation, integration, deployment, runtime operation, or production
readiness.

## Change And Release Procedure

1. Update the relevant canonical contract and tests.
2. Apply the version policy and update `package.json` when the toolkit version
   changes.
3. Update `CHANGELOG.md`, this baseline when applicable, and `docs/INDEX.md` if
   routing changes.
4. Run the complete baseline checks on the final source state.
5. Record the toolkit decision and milestone evidence in root governance.
6. Obtain explicit owner approval for final owner acceptance or a separately
   requested external release; routine authorized local maintenance is complete
   when its required checks pass.
7. Create a Git commit, tag, package publication, or external release only under
   separate explicit authorization.
