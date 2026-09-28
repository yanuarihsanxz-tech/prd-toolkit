---
description: Build an approved PRD through its local outcome milestones
argument-hint: <target-project-root> [prd-file]
---
Resolve the toolkit root from this command source: three directories above
`.reasonix/commands/prd/`. All toolkit paths below are relative to that root,
not the target project or current working directory. If the command was copied
elsewhere, use the explicitly supplied toolkit checkout path.

Treat `$1` as the target project root. `$2`, when present, is the approved PRD
path; otherwise use `<target-project-root>/PRD.md`. If `$1` is empty, stop and
request the target project root. Treat `$ARGUMENTS` as the complete
owner-provided invocation context.

Read `docs/REASONIX_ADAPTER.md` and follow its shared
efficiency, authority, pause, and summary contracts. Then follow
`layout/EXECUTE_TASKS.md`. Read the complete
`prompts/PHASE_GATED_TASK_RUNNER.md` only for explicitly
requested or existing runner-managed execution.

Use existing repository surfaces before adding abstractions or dependencies.
This execution command authorizes native scoped local building. Runner mode
preserves exact-plan approval. Continue ordinary local milestones automatically.
Run targeted checks inside implementation milestones and
one full applicable regression plus real behavioral/manual test in the final
integrated audit. Stop only at a genuine authority boundary, unresolved
failure, `PLAN_CHANGED`, state conflict, material missing input, or completion.
