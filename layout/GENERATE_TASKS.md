---
layout: generate-tasks
version: "3.0.0"
mode: generate-local-task-plan
toolkit_root: ".."
default_input: "@project/PRD.md"
default_output: "@project/TASKS.json"
application_code_changes: forbidden
---

# Generate a Local Task Plan

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Use this only when the user explicitly requests a stateful runner plan.
New native builds keep their compact plan in PROGRESS.md and do not need this
operation. Existing runner plans/states retain their original contracts.

```text
Use the PRD toolkit at <toolkit-root>.

mode: generate_tasks
project_root: @project
prd_file: @project/PRD.md
output_file: @project/TASKS.json

instructions:
  - Read the complete approved PRD and current repository.
  - Read prompts/PHASE_GATED_TASK_RUNNER.md.
  - Follow templates/task-plan.json and schemas/task-plan.schema.json.
  - Generate schema_version 2 with a unique plan id, approved PRD version, current ISO-8601 timestamp, and exact secret-free source fingerprint.
  - Select a planning profile before creating tasks: rapid for a low-risk single workflow, standard for a normal connected product, or high-risk only when production, sensitive data, financial/destructive effects, migration, or distributed recovery justify it.
  - Create ordered, independently executable delivery slices with unique refs. A runner task is a coherent user/operator-verifiable outcome and may span frontend, backend, data, tests, and documentation; use layer `vertical_slice` when it crosses code layers.
  - Keep implementation steps such as model, service, UI, persistence, and tests as an internal checklist inside one runner task when they contribute to the same outcome. Do not turn each file, component, code layer, or acceptance criterion into a separate runner transaction.
  - Order slices by dependencies, risk reduction, and earliest independently usable value. Use mock/stub data only when it enables a genuinely independent outcome rather than postponing the same slice's required integration.
  - Merge adjacent candidate tasks when they share one outcome, authority envelope, execution mode, verification boundary, overlapping paths, and rollback unit.
  - Split only when there is an independent user-visible outcome, distinct authority or production boundary, independently useful rollback point, separate runtime/deployment unit, or a source/context surface too large to verify safely as one slice.
  - Use 2-3 total runner tasks by default, including one final integrated audit. Rapid work uses 1 implementation task plus audit; standard work uses 2 implementation tasks plus audit. Use 4 only for independently meaningful outcomes and 5 only as an exceptional hard ceiling.
  - Never generate more than five tasks in one new plan. Put a genuinely separate authority, deployment, migration, rollback, or runtime program in its own plan.
  - Include objective, layer, phase, phase_total, nullable page, FR/NFR IDs, AC IDs, earlier-task dependencies, allowed/forbidden paths, verification contracts, authority envelope, and bounded max_attempts.
  - Verify that every task ID exists in the approved PRD and that the task set covers every implementation-scoped FR/NFR/AC without inventing requirements.
  - Apply progressive verification: targeted checks inside an implementation slice; full applicable regression plus real behavioral/manual product testing once in the final integrated audit. Fix in-scope defects found there and rerun affected evidence. Do not repeat the full repository suite for every internal step.
  - For user-facing products, make the first implementation task produce a runnable UI or vertical workflow when dependencies permit. For headless/backend products, deliver the earliest independently usable runtime outcome.
  - Treat phase, layer, page, and milestone changes as progress metadata only. Exact plan approval covers all declared local non-production tasks and the final local audit.
  - Set requires_owner_authorization true only for a genuine external, sensitive, destructive, staging, migration, financial, production, or final-acceptance authority boundary. Do not use it for ordinary implementation or verification.
  - Design for one initial plan approval. A second approval is optional only at a genuine high-risk authority boundary; a third is reserved for production/release/final acceptance.
  - Validate TASKS.json against the v2 schema and the runner's semantic checks.
  - Run only the read-only `next --json` command to display the canonical plan and source fingerprints plus `plan_approval_required`.
  - Do not call `approve-plan`; plan approval must come from the owner after reviewing the completed plan.
  - Do not implement any task.
  - Do not create or modify .prd/task-state.json.
```
