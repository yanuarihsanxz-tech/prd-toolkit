---
description: Generate and validate a new PRD from a product idea
argument-hint: <target-project-root> [product idea or evidence]
---
Resolve the toolkit root from this command source: three directories above
`.reasonix/commands/prd/`. All toolkit paths below are relative to that root,
not the target project or current working directory. If the command was copied
elsewhere, use the explicitly supplied toolkit checkout path.

Treat `$1` as the target project root. Treat the complete invocation
`$ARGUMENTS` as owner-provided context; the remaining text after the root may
contain the product idea, constraints, or evidence. If `$1` is empty, stop and
request the target project root.

Read `docs/REASONIX_ADAPTER.md` and follow its shared
efficiency, authority, pause, and summary contracts. Then follow
`layout/GENERATE_PRD.md` exactly for the target project.

Inspect the target repository and its applicable `AGENTS.md` before writing.
Create only the target project's `PRD.md`, `PROGRESS.md`, and `DECISIONS.md`.
Do not create `TASKS.json` or modify application code. Run the structural
validator and evidence checklist, repair in-scope structural findings, and
report unsupported claims as `UNVERIFIED`.
