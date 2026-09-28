---
description: Audit current implementation conformance against every PRD requirement
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
`layout/AUDIT_IMPLEMENTATION.md` exactly.

Cover every FR/NFR/AC ID and write only the target project's
`IMPLEMENTATION_AUDIT.md`. Keep structural, source, test, runtime, deployment,
and owner-acceptance evidence distinct. Do not repair code, change approved
behavior, mutate task state, deploy, or touch production.
