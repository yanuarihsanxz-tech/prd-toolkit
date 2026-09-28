---
layout: audit-implementation
version: "1.0.0"
mode: implementation-conformance-audit
toolkit_root: ".."
default_prd: "@project/PRD.md"
default_output: "@project/IMPLEMENTATION_AUDIT.md"
application_code_changes: forbidden
---

# Audit Implementation Against the PRD

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Use this after implementation, or as the final integrated audit, to prove what
the current source actually satisfies. This operation may write the audit
report but must not repair code or silently change requirements.

When used inside an approved build, the enclosing execution workflow owns
in-scope repairs and reruns this audit after changes. The standalone audit
operation remains read-only outside its report.

```text
Use the PRD toolkit at <toolkit-root>.

mode: implementation_conformance_audit
project_root: @project
prd_file: @project/PRD.md
task_file: @project/TASKS.json
state_file: @project/.prd/task-state.json
output_file: @project/IMPLEMENTATION_AUDIT.md

instructions:
  - Read the complete PRD, target AGENTS.md, current repository, relevant tests, progress, and decisions. Read TASKS.json and task state only if they exist; native builds do not require them.
  - Run `node <toolkit-root>/scripts/validate-prd.mjs @project/PRD.md --json` and keep structural evidence separate from implementation evidence.
  - Build the expected ID set from every FR-###, NFR-###, and AC-### in the PRD. Do not sample or omit IDs.
  - For each ID, record expected behavior, implementation surface, current verification evidence, and exactly one status: VERIFIED, PARTIAL, NOT_IMPLEMENTED, UNVERIFIED, or N/A - [specific reason].
  - VERIFIED requires direct current evidence from the exact inspected source state. File presence, compilation, an old task completion, or a mock alone is insufficient when runtime behavior is claimed.
  - Run the full applicable regression suite and real behavioral/manual product checks authorized for the local environment. Record exact commands or interactions, result, environment, and limitations.
  - Test material failure paths, forbidden side effects, authority boundaries, migration/recovery behavior, and external-provider degradation when applicable.
  - Apply the Evidence Quality section of prompts/RELIABILITY_GUIDE.md. Assert expected post-action values or state; distinguish presence checks from behavior checks, locator failures from product defects, and caught logs from uncaught failures. Missing or unexercised checks cannot pass. Report skips, blocked checks, and evidence limits alongside totals.
  - Reconcile PRD traceability, TASKS.json, task state, code, tests, and runtime observations. Report contradictions instead of choosing the most favorable source.
  - Include selected capability routes, unavailable candidates, fallback reasons, affected IDs, and evidence limitations. A fallback never lowers an acceptance criterion or proves live behavior from mocks alone.
  - Rank gaps by realized impact, blocked user outcome, safety or data risk, and causal relevance. Do not let documentation-only defects outrank broken product behavior.
  - Create IMPLEMENTATION_AUDIT.md with: source-state identity; readiness level; requirement-conformance matrix; regression and behavioral evidence; contradictions; prioritized gaps; limitations; and one exact next action.
  - Do not modify application code, PRD behavior, TASKS.json, task state, progress, decisions, dependencies, credentials, external systems, deployment, or production.
  - Never claim production readiness or owner acceptance from this audit.
```
