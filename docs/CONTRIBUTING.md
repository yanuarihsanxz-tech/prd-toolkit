# Contributing

Use this guide to extend the PRD Toolkit without breaking its AI-agent workflow.

## Your First Contribution

1. Fork the repository and create a branch for one user-visible improvement.
2. Run `npm run check` in the checkout. No package installation is needed.
3. Make the smallest complete change and run the affected checks.
4. Open a pull request with the problem, result and actual verification. An issue
   is useful for discussing a large design change; small docs fixes and clear
   reproducible bug fixes do not need an approval ceremony.

Useful starting points:

- Clarify a setup step that you could not follow from a fresh checkout.
- Provide a sanitized PRD that falsely passes or fails, with expected findings.
- Improve a product flowchart while preserving its requirement and failure paths.
- Report an actual OS/Node/host compatibility result with versions and limits.

For prompt changes, show a before/after handoff against the same resolved product
scope. For validator changes, include a regression case that fails without the
fix. Do not claim model quality or token savings from string-matching tests.
Run `npm run check` before submitting. New distributed files must be added to
`CANONICAL_PATHS` in `scripts/validate-toolkit.mjs` so clean exports include them.
Do not copy another project's code or text without checking its license and
preserving any required attribution. Contributions use this project's MIT license.

## Core Rules

- Keep all content in English unless a specific example requires otherwise.
- Keep templates parseable as Markdown with YAML frontmatter.
- Use Mermaid for diagrams.
- Keep prompt files vendor-agnostic.
- Preserve native build authorization, optional runner exact-plan approval, genuine authority boundaries,
  default two-or-three milestone budget, exceptional five-milestone ceiling,
  progress tracking, decision logging, and traceability.
- Use unique `FR-###`, `NFR-###`, and `AC-###` IDs and preserve two-way
  traceability.
- Follow `docs/INDEX.md`: update the owning document first and link to it from
  other surfaces instead of creating a competing policy.

## Change A Versioned Contract

1. Classify the change with the Patch/Minor/Major policy in `BASELINE.md`.
2. Increment schema identifiers independently when a schema contract breaks.
3. Keep `package.json`, `BASELINE.md`, and `CHANGELOG.md` on the same toolkit
   version.
4. Update routing and regression coverage in the same change.
5. Do not create a Git tag, package publication, or external release without
   separate explicit authorization.

Superseded documentation follows `docs/archive/README.md`; do not delete it or
leave two authoritative copies.

## Add Or Update A Template

1. Decide whether the new template is an app-style template or a tool-style template.
2. Start from `templates/full.md` or `templates/lite.md`.
3. Keep required YAML keys:
   `project`, `version`, `status`, `current_milestone`, `total_milestones`, `type`, `tech_stack`, `created`, `ai_instructions`.
4. Validate metadata against `schemas/prd-frontmatter.schema.json`, including
   `current_milestone <= total_milestones`; new unapproved templates start at
   `current_milestone: 0`.
5. Keep operative requirements, acceptance criteria and builder instructions visible.
   Use HTML comments only for template-author notes that do not establish contracts.
6. Include a two-way traceability matrix with FR/NFR IDs, AC IDs,
   implementation surfaces, milestones, and required evidence.
7. Validate the supported scalar/block-list frontmatter with validate-prd.mjs.
8. Update `README.md` if the template becomes part of the public toolkit.

## Add An Example

1. Pick the matching template.
2. Fill every section with realistic content.
3. Include at least one Mermaid diagram.
4. Include Done When criteria for every milestone.
5. Include unique FR/NFR/AC IDs and a two-way traceability matrix with no empty cells.
6. Mark unverified technology versions as unverified instead of guessing.
7. Add the example link to `README.md`.
8. Add or update a representative case in
   `evals/generator-regression-cases.json` and keep it valid against
   `schemas/generator-regression.schema.json`.

## Adapt A Prompt

1. Keep `prompts/PRD_GENERATOR_PROMPT.md` under 500 lines.
2. Preserve auto-detection between Full and Lite templates.
3. Preserve the Two-Layer Design instruction.
4. Preserve YAML frontmatter output rules.
5. Preserve at least 14 quality gates.
6. Preserve traceability matrix requirements.
7. Do not rely on provider-specific syntax unless the prompt is explicitly forked for that provider.

## Change Discovery Or Conformance Auditing

1. Keep `layout/DISCOVER_PRODUCT.md` limited to evidence, assumptions, solution
   boundaries, and the PRD handoff. It must not become a duplicate PRD or modify
   application code.
2. Keep `layout/AUDIT_IMPLEMENTATION.md` exhaustive across every FR/NFR/AC ID
   and read-only for application behavior. A separate repair request may use its
   findings later.
3. Keep `DISCOVERY.md`, `PRD.md`, and `IMPLEMENTATION_AUDIT.md` lifecycle roles
   distinct and link rather than copy complete content.
4. Preserve selective EARS-style acceptance wording. Require observable
   trigger/condition and response where helpful, but do not force syntax that
   makes a simple invariant harder to read.
5. Update Reasonix commands, lifecycle routing, deterministic adapter checks,
   and the full toolkit regression together.
6. Keep the Builder Capability Routing Contract inside the existing Full
   Architecture or Lite Architecture & Data Flow section. Every row requires a
   trigger, capability, preferred route conditional on availability,
   repository-native fallback, evidence, and authority.
7. Test that generated PRDs fail when routing is missing or assumes a named
   skill is callable without inspecting the builder host.
   Also test misplaced/hidden routing, unresolved cells, and instructions or
   tables outside the contract; keep fallback evidence equivalent to the PRD's
   acceptance criteria. A static pass cannot prove that equivalence.

## Change The Task Runner Or Task Schema

1. Keep `templates/task-plan.json`, `schemas/task-plan.schema.json`,
   `schemas/task-state.schema.json`, `scripts/local-task-runner.mjs`,
   `prompts/PHASE_GATED_TASK_RUNNER.md`, and both task layouts semantically
   aligned.
2. Increment the task-plan/state schema version for breaking changes; never
   reinterpret an older state as stronger evidence.
3. Preserve canonical plan/source fingerprint binding, explicit plan approval
   and genuine authority evidence, monotonically increasing state revision,
   append-only event sequencing, and the rule that phase/layer changes alone
   never create checkpoints.
4. A failed task must keep `done: false`, block all later tasks, preserve
   `last_completed`, and retain every failed attempt through retry.
5. Keep retries bounded by `max_attempts`; exhausted attempts require a new
   owner-approved plan rather than state deletion or task skipping.
6. Require secret-free source/preflight evidence on `start` and all declared
   verification IDs plus evidence on `complete`.
7. Run the complete runner regression suite, including plan mutation, failure,
   retry, attempt exhaustion, authority, state lock, ordering, and v1 refusal.
8. If bounded run authorization changes, also test exact fingerprint matching,
   contiguous inclusive bounds, production refusal, authority-gate coverage,
   post-bound checkpoint restoration, and append-only attempt/event evidence.
9. Default new plans to two or three outcome milestones including final audit.
   Four needs written justification and five is exceptional. Preserve
   compatibility for historical schema-v2 plans; do not reinterpret evidence.
10. Descriptive phase, layer, page, component, and milestone changes must not
    create checkpoints. Declared genuine owner authority, production,
    acceptance, plan mutation, and state locking remain enforced.

## Add Model-Specific Guidance

If a model needs extra guidance:

1. Add a short subsection to the prompt.
2. Keep it optional and vendor-agnostic where possible.
3. Prefer output constraints over chain-specific tricks.
4. Test the same rough idea against the default prompt and the adapted prompt.
5. Keep the stricter output if both work.

## Change An Agent Adapter

1. Keep `layout/`, `prompts/`, schemas, and runner contracts vendor-neutral and
   authoritative. An adapter routes to them; it never forks their policy.
2. Keep Reasonix command source under `.reasonix/commands/prd/` and document
   shared behavior in `docs/REASONIX_ADAPTER.md` instead of duplicating it in
   every command.
3. Require an explicit target project root, read target repository
   instructions, and preserve toolkit-versus-target governance separation.
4. Do not add an agent binary, provider, credential, MCP server, workflow skill,
   or package dependency to the toolkit baseline.
5. Preserve full user-facing PRD meaning and evidence. Efficiency rules may
   compress internal handoffs, repeated narration, and unnecessary code only.
6. Extend deterministic adapter checks and run the full toolkit regression.
7. Keep discovery and conformance-audit commands read-only outside their single
   declared target report; they must never install dependencies or mutate
   application code, task state, deployment, or production.

## Concrete Example

To add a new "API-only service" example:

1. Start from `templates/lite.md`.
2. Set `type: "tool"` because the project has no user-facing app UI.
3. In `Architecture & Data Flow`, document request sources, service boundaries, external APIs, and response contracts.
4. In `Implementation & Milestones`, include health check, auth, core endpoint, error handling, and deployment milestones.
5. In `Risks`, include rate limits, auth failure, schema drift, and downstream outage.
6. Add the finished file under `examples/`.
7. Update `README.md`.

## Validation Before Submitting Changes

Run the automated structural and regression suite first:

```bash
node scripts/validate-toolkit.mjs --json
node --test
```

The toolkit validator must stay dependency-free, emit stable finding codes,
bind its report to a secret-free source fingerprint, and keep validation
findings (`1`) distinct from invocation/input failure (`2`). Generator cases
must use checked-in sanitized outputs or deterministic exact-one mutations;
they must not invoke a live model, provider, recipient, or application runtime.

Then complete the evidence-based checks that automation cannot prove:

- All referenced files exist.
- YAML frontmatter parses.
- Frontmatter satisfies `schemas/prd-frontmatter.schema.json` and its cross-field semantics.
- FR/NFR/AC IDs are unique and two-way traceability has full set coverage.
- Mermaid blocks use Mermaid code fences.
- Generator prompt stays under 500 lines.
- No stale paths point to retired prompt names.
- No secret values appear in examples or docs.
- Task-plan template and schema use version 2 and runner semantic validation
  accepts the customized fixture.
- Runner tests prove failure cannot advance or produce `done`, approvals are
  fingerprint-bound, and retry preserves prior attempt evidence.
- Runner tests prove phase and layer changes do not require approval, while
  explicitly declared authority boundaries still do.
- The canonical task-plan template demonstrates the default three outcomes and
  reserves final cross-cutting regression/manual testing for integrated audit.
- Structural success is not a checklist score and does not prove factual
  product correctness, feasibility, runtime behavior, or production readiness.
