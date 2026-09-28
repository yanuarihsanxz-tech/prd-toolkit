---
description: Research a product idea and create a PRD-ready discovery brief
argument-hint: <target-project-root> [product idea or evidence]
---
Resolve the toolkit root from this command source: three directories above
`.reasonix/commands/prd/`. All toolkit paths below are relative to that root,
not the target project or current working directory. If the command was copied
elsewhere, use the explicitly supplied toolkit checkout path.

Treat `$1` as the target project root. Treat the complete invocation
`$ARGUMENTS` as owner-provided context; the remaining text after the root may
contain the idea, known evidence, constraints, or unresolved questions. If
`$1` is empty, stop and request the target project root.

Read `docs/REASONIX_ADAPTER.md` and follow its shared
efficiency, authority, pause, and summary contracts. Then follow
`layout/DISCOVER_PRODUCT.md` exactly.

Inspect local evidence first and research only material unresolved decisions.
Write only the target project's `DISCOVERY.md`; do not create the PRD, plan,
governance files, application code, dependencies, credentials, or external
side effects. End with the discovery verdict and a compact PRD handoff summary.
