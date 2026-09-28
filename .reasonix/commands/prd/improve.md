---
description: Audit, improve, and revalidate an existing PRD
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
`layout/IMPROVE_PRD.md` exactly.

Preserve pre-edit finding codes and approved product behavior. Make the
smallest changes that close confirmed requirement, traceability, contract, and
verification gaps. Do not modify application code or task state. Re-run both
evidence layers after editing and report remaining `UNVERIFIED` items.
