---
description: Generate a compact fingerprint-bound implementation plan
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
`layout/GENERATE_TASKS.md` exactly.

Generate only the target project's `TASKS.json`. Prefer two or three
user/operator-verifiable outcome tasks including the final integrated audit.
Keep component and file steps inside each outcome. Validate the plan and show
the exact plan/source fingerprints, but do not approve the plan, create task
state, or implement code.
