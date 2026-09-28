# Changelog

All notable PRD Toolkit changes are recorded here. This file describes local
toolkit versions; it does not imply a Git tag, npm publication, deployment, or
external release.

The format follows Added, Changed, Fixed, Security, and Removed categories.
Toolkit versions follow the policy in `BASELINE.md`.

## [Unreleased]

### Fixed

- Use Node's test discovery so the check command works on supported Node versions.
- Check POSIX state-file permissions only on systems that expose POSIX mode bits.
- Clarify the coordinator role, specialist-tool boundaries, optional Reasonix
  adapter, and public checkout command in first-use documentation.

## [3.1.2] - 2026-09-27

### Fixed

- Proportional specification depth independent of Full/Lite product shape.
- Capability-to-evidence selection with applicable tools and stable acceptance outcomes.
- Audit guidance against presence-only assertions, false passes, locator bias,
  suppressed diagnostics and unsupported benchmark claims.

## [3.1.1] - 2026-09-27

### Fixed

- Simplified the PRD-only entry: one invocation uses resolved conversation
  context, validation, summary and product flow automatically.
- Explicit analysis-only requests remain read-only; existing PRDs are reviewed
  without an invented rewrite. New/rework/bug-fix context shapes the specification
  without triggering application implementation or debugging.
- Removed build/audit/runner routing from the default entry while preserving
  explicit legacy utilities and self-contained builder contracts.

## [3.1.0] - 2026-09-27

### Added

- An owner-facing product summary with the saved Mermaid flowchart after PRD
  generation or a material behavior revision. No extra target artifact is required.
- A dependency-free preview-prd command that extracts the saved overview and
  product flow after structural validation; it never invents missing behavior.
- Bug/improvement issue templates, a focused PR template and beginner contribution
  guidance with concrete examples and verification expectations.

### Changed

- Full/Lite example flows expose material failure paths. Lite's starter diagram
  is a readable flowchart; legacy sequence-only PRDs remain structurally valid.

## [3.0.3] - 2026-09-27

### Changed

- Prepared the toolkit for public reuse with portable onboarding and clean
  repository content. Personal development history is retained outside the
  repository; current design decisions and general lessons remain documented.
- Moved unrelated generated pet assets outside the toolkit without deleting them.
- Added distribution checks rejecting personal paths and local-only artifacts.

## [3.0.2] - 2026-09-27

### Fixed

- Structural validation ignores hidden requirement, acceptance, milestone, and
  section contracts in comments and code examples. Empty requirement and
  acceptance cells fail explicitly.
- CLI entry points execute correctly through symlinked checkout paths.
- Operation layouts and optional Reasonix commands resolve the toolkit checkout
  instead of requiring an author-specific absolute path.
- Local run artifacts and dependency/output directories are excluded from
  repository Markdown validation and Git distribution.

### Added

- Portable distribution verification and GitHub Actions checks, with a clean
  export command and explicit publication/evidence limits.

## [3.0.1] - 2026-09-12

### Changed

- Shortened generator and generation entry; removed fixed ten-step reasoning,
  duplicated template specifications, and copied traceability review tables.
- Full/Lite templates define milestone outcomes once and use product-specific
  infrastructure. One diagram may cover flow and architecture; further diagrams
  need distinct information. Progress stores references, live evidence, and
  resume deltas instead of another plan. Builders inspect affected changes on
  continuation rather than repeating whole-project/tool discovery per file.
- Reliability checklist applicability is per actual control/risk: local state
  does not imply providers, schedulers, notification delivery, or session systems.
- Embedded builder instructions remain portable and synchronized. Complete
  FR/NFR/AC coverage, targeted checks, final real-path audit/repair, 2-3 default
  milestones, and all native/runner authority boundaries remain intact.

### Evidence

- Added regressions for compact Full/Lite handoffs with one diagram and one
  milestone table, unchanged requirement/AC coverage, and matching embedded
  builder instructions. Existing validators and runner behavior are unchanged.
- [Measured generation reading sets](evals/efficiency-rework-2026-09-12.md)
  shrink 24.5% Full and 25.9% Lite in UTF-8 bytes. No new model/build trial,
  billed-token measurement, dependency installation, or target-app change.

## [3.0.0] - 2026-09-05

### Changed

- Root SKILL.md is the single folder entry, routing research, generation,
  improvement, review, and building by the current request. prompts/SKILL.md
  remains a small compatibility adapter; normal use no longer loads its former
  duplicated runner instructions, maintenance history, or all reference files.
- New local builds use the active host's native plan and target PROGRESS.md.
  An explicit build request supplies scoped local authority; no routine second
  approval or TASKS.json/state is required. Existing/requested runner mode
  retains exact-fingerprint approval, failure, ordering, and recovery semantics.
- New PRDs point ai_instructions to their own builder contract. The embedded
  contract supports PRD-only native building and exhaustive final audit without
  access to the toolkit or original conversation.
- Simplified overview/onboarding and conditional guidance; removed generator
  instructions that copied the toolkit's architecture into arbitrary products,
  imposed arbitrary edge-case counts, or repeated the entire saved PRD in chat.
- Rechecked Ponytail, Caveman, Honey, Reasonix, DeepSeek Harness, and official
  Codex discovery guidance. Retained local minimality and explicit capability
  routing; added no third-party skill, runtime, encoding, or dependency.

### Fixed

- Native authority wording can pass structural validation without a mandatory
  runner-approval phrase. New PRD-local instruction anchors must resolve visibly.
- Optional runner audit scope now includes IMPLEMENTATION_AUDIT.md and requires
  passing evidence for all required implementation checks; a limitation cannot
  substitute for a required passing check.

### Compatibility And Evidence

- Default workflow/authority changes warrant a major version. Existing 10/6
  section shapes, IDs, metadata schema, runner schemas and CLI semantics remain
  compatible; historical path-style ai_instructions remains readable.
- Local fixtures and CLI regressions remain structural evidence. An isolated
  generation-to-fresh-builder trial is recorded in evals/forward-test-report.md;
  it is not proof of
  universal model quality, production readiness, or guaranteed cost savings.

## [2.3.1] - 2026-09-05

### Fixed

- Builder-routing validation now requires one visible subsection inside
  Architecture and its own six-column table and availability instructions.
  Commented/fenced contracts, unrelated tables, duplicate contracts, malformed
  rows, and unresolved template cells cannot satisfy the routing requirement.
- Full/Lite templates now contain visible builder startup instructions instead
  of relying on generator prose or hidden template comments.
- Fresh-conversation review retains material decisions, exclusions, research
  conclusions, prerequisites, and the local start/verification path in the PRD.
- Routing guidance requires reading matched skill instructions, checking route
  prerequisites, and recording affected IDs and evidence limits in the existing
  plan/audit. Fallbacks cannot weaken acceptance criteria or turn fixtures into
  live verification. Integrated-build repair authority is distinguished from
  the standalone read-only audit.

### Verification And Compatibility

- Added regression coverage for previously accepted invalid routing and toolkit
  template drift. The suite uses local fixtures and deterministic mutations;
  it does not invoke a model or prove a fresh builder's end-to-end behavior.
- This patch enforces the existing 2.3.0 routing contract more accurately.
  Correct PRDs retain the same sections, IDs, metadata, and task-plan/state
  schemas. Previously accepted malformed routing may now fail validation.
- No external skills, packages, services, or target applications are added.

## [2.3.0] - 2026-09-02

### Added

- Added a mandatory Builder Capability Routing Contract inside the existing
  architecture section of every Full and Lite PRD.
- Added deterministic PRD validation for non-empty trigger, capability,
  preferred route, fallback, evidence, and authority mappings plus explicit
  host-availability inspection.

### Changed

- The primary flow is now completed brainstorming/research conversation → PRD
  → fresh implementation conversation. `DISCOVERY.md` is optional and used only
  when research evidence needs a durable cross-conversation lifecycle.
- A fresh builder now reads one PRD, inspects the host-provided available
  skills/tools, uses matching callable routes, and follows repository-native
  fallbacks while recording missing preferred routes as `UNAVAILABLE`.
- Ponytail, Caveman, Honey, Reasonix, RTK, Headroom, and similar names do not
  become implicit dependencies merely by appearing in research or a PRD.

### Compatibility

- Full/Lite top-level section counts, frontmatter, FR/NFR/AC rules, task-plan
  and task-state schema identifiers, runner ordering, and historical evidence
  remain compatible. Existing PRDs require regeneration or focused improvement
  to receive the new builder-routing contract.

### Security

- A PRD cannot authorize installation, login, credentials, MCP configuration,
  external mutation, deployment, destructive action, purchase, or production.
  Those remain explicit authority boundaries in every capability route.

## [2.2.0] - 2026-09-02

### Added

- Added a discovery operation and `/prd:discover` adapter command that create a
  concise, evidence-aware `DISCOVERY.md` before PRD generation.
- Added a read-only implementation-conformance operation and `/prd:audit`
  command that map every PRD requirement and acceptance criterion to current
  source, test, and runtime evidence in `IMPLEMENTATION_AUDIT.md`.
- Added lifecycle tool routing and measured-adoption rules for EARS-style
  acceptance wording, RTK, Headroom, Superpowers, and related efficiency
  patterns.

### Changed

- PRD generation and improvement now use selective EARS-style condition/trigger
  plus observable-response wording where event, state, fault, optional-feature,
  or timing behavior benefits from it.
- Final integrated execution now includes exhaustive PRD-to-code conformance
  reconciliation in addition to full applicable regression and real
  behavioral/manual testing.
- Reasonix now exposes seven canonical lifecycle commands without becoming a
  required runtime or a second policy source.

### Compatibility

- Existing PRDs, Full/Lite section counts, frontmatter, task-plan/state schema
  identifiers, runner ordering, and historical evidence remain compatible.
  The two new target-project reports have distinct lifecycles and do not replace
  existing artifacts.

### Security

- Discovery and audit commands write only their declared target reports and do
  not install dependencies, store credentials, repair code, mutate task state,
  deploy, or touch production.

## [2.1.0] - 2026-09-02

### Added

- Added five optional Reasonix custom commands covering PRD generation,
  read-only validation, focused improvement, compact task planning, and
  fingerprint-bound execution.
- Added one canonical Reasonix adapter guide with target-project isolation,
  activation, authority, pause, summary, and evidence contracts.
- Added deterministic adapter validation for command metadata, arguments,
  canonical layout routing, permission posture, and shared-policy references.

### Changed

- Added a reuse-first minimality ladder and concise internal-handoff policy.
  These rules adopt useful ideas from current efficiency workflows without
  adding Ponytail, Caveman, Honey, Spec Kit, SpecD, MCP, model, or package
  dependencies.
- Extended onboarding, routing, contribution, skill, and canonical-context
  documentation for Reasonix while retaining vendor-neutral layouts as the
  source of truth.

### Compatibility

- PRD section counts, layouts, frontmatter schema, task-plan/state schema
  identifiers, runner semantics, and historical evidence remain unchanged.

### Security

- Adapter commands require an explicit target root, preserve target/toolkit
  governance separation, forbid unrestricted permission flags, and keep
  credentials plus external setup outside tracked artifacts.

## [2.0.0] - 2026-08-31

### Changed

- Replaced phase-gated local delivery with product-first outcome milestones.
  New plans default to two or three total milestones including final audit;
  four requires written justification and five is exceptional.
- One exact-plan approval now covers all declared ordinary local
  non-production milestones, targeted checks, in-scope fixes, and final audit.
  Phase, layer, component, page, and milestone labels no longer create approval
  checkpoints.
- The first implementation milestone must make the product runnable or visibly
  testable when dependencies permit. The final milestone performs full
  applicable regression and real manual/behavioral product testing, fixes
  in-scope defects, and reruns affected evidence.
- Every milestone handoff now requires a complete summary of the delivered
  outcome, changed surfaces, what works, how to try it, verification,
  limitations, overall progress, and next step, then continues automatically.
- Safe in-scope local retries may be authorized by the builder. New scope,
  authority, required owner input, external state, deployment, production, and
  final acceptance remain owner boundaries.

### Compatibility

- PRD section counts and task plan/state schema identifiers remain unchanged so
  historical schema-v2 evidence stays readable. The major version reflects the
  intentional change in runner checkpoint and governance semantics.

### Security

- Exact plan/source fingerprint binding, immutable failed attempts, bounded
  retries, state locking, task ordering, production refusal, secret handling,
  and explicit final owner acceptance remain enforced.

## [1.2.0] - 2026-08-30

### Added

- Added a conditional research and tool-routing contract covering primary-source
  budgets, Context7, GitHub, browser tooling, n8n, local security scanning,
  agent-skill evaluation, context compression, orchestration, credentials, and
  default rejections.
- Added deterministic regression coverage for the five-slice canonical task
  template and same-phase cross-layer continuation.

### Changed

- New plans use at most five outcome-oriented delivery slices, including one
  final integrated audit; frontend, backend, data, tests, and documentation may
  be grouped when they prove one user/operator outcome.
- A descriptive layer change alone no longer creates a runner checkpoint.
  Phase and declared authority gates remain fingerprint-bound and fail closed.
- Verification is progressive: targeted checks during implementation slices,
  then full applicable regression plus real behavioral/manual product testing
  once in the final integrated audit, including in-scope fixes and affected
  evidence reruns.
- The final local qualification audit can remain inside one bounded `AUTORUN`;
  final human acceptance and any production action remain separate explicit
  verdicts.
- Session execution builds one bounded PRD/plan context index and uses targeted
  rereads instead of repeating a full repository scan for each slice.

### Security

- Existing plan/source fingerprint binding, failure blocking, evidence-bearing
  retry, production refusal, final owner acceptance, ordered execution, state
  locking, and secret-free evidence rules remain enforced.
- External tools and credentials remain optional host concerns; this rework
  adds no package dependency, MCP configuration, credential value, target-application
  change, external deployment, or production action.

## [1.1.0] - 2026-08-30

### Added

- Added `authorize-run <through-ref>` for one explicit, fingerprint-bound owner
  authorization covering a contiguous non-production task range.
- Added `AUTORUN` as the universal one-key user interface; agents translate it
  internally into exact-current-plan approval and bounded authorization without
  asking the owner for fingerprints, paths, task refs, or shell commands.
- Added backward-compatible task-state evidence for bounded run authorization,
  including covered refs, execution modes, inclusive bounds, owner evidence,
  attempt provenance, and append-only `run_authorized` events.

### Changed

- Covered phase, layer, and declared task-owner authority gates no longer
  require repetitive per-task approval; normal checkpoint behavior resumes
  immediately after the inclusive bound.
- Runner documentation and execution layouts now distinguish bounded
  autonomous continuation from unrestricted approval bypass.

### Security

- Bounded authorization rejects production coverage and cannot bypass plan
  fingerprint changes, failure blocking, evidence-bearing retry, state locking,
  ordered execution, or tasks outside its recorded range.

## [1.0.0] - 2026-08-29

### Added

- Full 10-section and Lite 6-section PRD templates with canonical metadata.
- Stable `FR-###`, `NFR-###`, and `AC-###` contracts with two-way
  traceability.
- Target-project progress and decision templates separated from toolkit
  governance.
- Reliability guide covering authority, state, providers, resources, evidence,
  readiness, and bounded operations.
- Task-plan and task-state schema v2 with fingerprint-bound approvals,
  fail-closed failure handling, preserved attempts, explicit retry, and state
  locking.
- Dependency-free generated-PRD and whole-toolkit validators with stable
  finding codes and explicit exit semantics.
- Schema-governed representative Full, Lite, and negative generator regression
  cases.
- Canonical documentation index, archive policy, and repository baseline.

### Changed

- Normalized toolkit naming to `PRD Toolkit` in onboarding and maintenance
  documentation.
- Consolidated routing so `README.md` is the overview, `docs/GETTING_STARTED.md`
  is procedural onboarding, `PROJECT_CONTEXT.md` is the canonical contract,
  and `docs/CONTRIBUTING.md` governs changes.
- Validation now runs structural preflight before evidence-based checklist
  scoring without converting a structural pass into readiness.

### Security

- Documented secret-free examples, evidence, logs, and source fingerprints.
- Preserved explicit authority boundaries for provider calls, production modes,
  destructive effects, and financial or other safety-sensitive execution.

### Removed

- No approved product behavior, reliability classification, historical
  evidence, or task-runner safety invariant was removed in this baseline.
