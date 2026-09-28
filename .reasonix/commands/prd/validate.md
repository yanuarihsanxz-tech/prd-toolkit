---
description: Audit a PRD without editing it
argument-hint: <target-project-root> [prd-file]
---
Resolve the toolkit root from this command source: three directories above
`.reasonix/commands/prd/`. All toolkit paths below are relative to that root,
not the target project or current working directory. If the command was copied
elsewhere, use the explicitly supplied toolkit checkout path.

Treat `$1` as the target project root. `$2`, when present, is the PRD path;
otherwise use `<target-project-root>/PRD.md`. If `$1` is empty, stop and request
the target project root. Treat `$ARGUMENTS` as the complete owner-provided
invocation context.

Read `docs/REASONIX_ADAPTER.md` and follow its shared
efficiency, authority, pause, and summary contracts. Then follow
`layout/VALIDATE_PRD.md` exactly.

Inspect the target repository and applicable `AGENTS.md`. Run the deterministic
structural preflight before the evidence checklist. Keep structural findings,
product judgment, and runtime evidence separate. Do not edit the PRD,
application code, governance files, `TASKS.json`, or task state.
