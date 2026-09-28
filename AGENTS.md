# Codex Repository Instructions

This repository is a PRD toolkit. Keep all technical instructions and generated
PRDs in clear professional English unless the user explicitly requests another
language.

## Required Routing

- When the user references this folder for product work, read `SKILL.md` and
  only the selected operation. Keep research-only requests read-only; generation
  does not imply implementation. The target project is separate from this toolkit.
- For toolkit maintenance or canonical standards, read `PROJECT_CONTEXT.md`.
- For documentation ownership, onboarding, maintenance, version, or archive
  routing, read `docs/INDEX.md`.
- For a single-purpose copy-paste prompt, choose exactly one file from
  `layout/INDEX.md`.
- Feed brainstorming and research from the current conversation directly into
  PRD generation. Use `layout/DISCOVER_PRODUCT.md` only when evidence must
  survive a conversation boundary or has a distinct lifecycle; keep any target
  `DISCOVERY.md` distinct from the later PRD.
- For PRD generation or review, read root `SKILL.md` first.
  `prompts/SKILL.md` remains a compatibility entry.
- For a new PRD, follow `prompts/PRD_GENERATOR_PROMPT.md` and select
  `templates/full.md` or `templates/lite.md`.
- Every generated PRD must embed a Builder Capability Routing Contract inside
  its existing architecture section. Route triggers to capabilities, preferred
  skills/tools only when available, repository-native fallbacks, evidence, and
  authority. A PRD cannot install or make a missing skill callable.
- For validation, run `scripts/validate-prd.mjs` as the deterministic structural
  preflight, then use `prompts/PRD_VALIDATION_CHECKLIST.md` for applicability,
  evidence, scoring, and product judgment.
- For reliability, verification, or anti-trial-and-error work, also read
  `prompts/RELIABILITY_GUIDE.md`.
- For a post-build or final integrated PRD-to-code audit, use
  `layout/AUDIT_IMPLEMENTATION.md`, cover every FR/NFR/AC ID, and keep
  structural, source, test, runtime, deployment, and owner-acceptance evidence
  distinct.
- New builds default to native planning in target `PROGRESS.md`, following
  `layout/EXECUTE_TASKS.md`; an explicit build request authorizes scoped local
  implementation without another routine approval. Use the stateful runner only
  when requested or a toolkit runner plan/state exists. Read
  `prompts/PHASE_GATED_TASK_RUNNER.md` completely before invoking its CLI.
- Preserve toolkit decisions in root `DECISIONS.md` and toolkit milestone state
  in root `PROGRESS.md`. For a generated target project, initialize and update
  that project's own `DECISIONS.md` and `PROGRESS.md` from the corresponding
  files in `templates/`; never mix target-project state into the toolkit logs.
- Treat `package.json`, `BASELINE.md`, and `CHANGELOG.md` as one version
  contract. Do not claim a Git tag, publication, or release without separate
  explicit evidence and authorization.

## Format Policy

- Use Markdown for human-readable instructions and PRD content.
- Use YAML frontmatter for document and skill metadata.
- Use YAML for concise configuration examples.
- Use JSON for API, event, state, and verification-receipt contracts.
- Use Mermaid for diagrams.
- Do not convert narrative workflows into large YAML or JSON documents; keep
  structured formats for data that benefits from deterministic parsing.

## Quality and Safety

- Preserve commands, IDs, paths, URLs, schemas, thresholds, and approved product
  behavior exactly unless the user requests a change.
- Use `FR-###`, `NFR-###`, and `AC-###` as stable, unique IDs. Maintain two-way
  traceability from every feature/capability to requirements, acceptance
  criteria, implementation surfaces, milestones, and evidence—and back again.
- Validate PRD frontmatter against `schemas/prd-frontmatter.schema.json` and
  enforce `current_milestone <= total_milestones`; a new unapproved PRD starts
  with `status: draft` and `current_milestone: 0`.
- Mark unsupported claims `UNVERIFIED`; never invent evidence.
- Never store secrets, tokens, credentials, cookies, or private keys in tracked
  files, examples, logs, or reports.
- Inspect current files before reporting status.
- Validate frontmatter, section count, links, diagrams, traceability, and
  secret handling before delivery.
- Treat a structural-validator pass as bounded evidence, not as proof of
  factual correctness, runtime behavior, or production readiness.
- Do not claim implementation, operational, or production readiness without
  naming the proven readiness level and its evidence.
- For task-plan v2 execution, require exact plan-fingerprint approval, persist
  preflight/completion evidence, and treat any failed task as a plan-wide block.
  Never advance, erase an attempt, or reuse approval after `PLAN_CHANGED`.
- Generate two or three outcome-oriented milestones by default, including the
  final integrated audit. Use four only for independently meaningful outcomes
  and five only as an exceptional hard ceiling. Group frontend, backend, data,
  tests, and documentation when they prove one outcome; component steps remain
  an internal checklist. Preserve older approved plans as historical evidence.
- Use targeted checks during implementation slices. Reserve full applicable
  regression and real behavioral/manual product testing for the final
  integrated audit, where in-scope defects are fixed and affected evidence is
  rerun. The user build request covers native local implementation; runner mode
  retains exact plan approval. Ordinary milestone transitions never create an
  approval checkpoint. New scope, uncovered high-risk authority, production,
  and final owner acceptance remain explicit boundaries.
- Make a runnable or visibly testable product available as early as dependencies
  allow. Missing optional benchmark media, credentials, provider access, or
  release inputs do not block safe local implementation; mark only the dependent
  behavior `UNVERIFIED` and continue useful work.
- After every milestone, summarize the delivered outcome, grouped changed
  surfaces, what works, one exact way to try it, verification, material
  limitations, progress, and whether the next milestone continues automatically.
