---
name: prd-maker
description: Prepare a self-contained PRD from conversation or existing-project context. Use for requests to write, revise, or review a PRD or specification, including reworks and bug fixes. Honors analysis-only requests. Validation, owner summary, and product flowchart are automatic. Specification only; it does not build.
---

# PRD Maker

This is the entry point when the user references this folder. Resolve toolkit
paths relative to this file. Work in the user's target project, not this toolkit.
The current request determines the operation; attaching a file alone does not
authorize implementation, installation, deployment, or external writes.

## One-Call Default

When the user calls this toolkit after discussing a product, read the existing
conversation and relevant target files. Do not ask them to repeat scope, choose
Full/Lite, request validation, request a summary/flowchart, or say "do not build".
Those behaviors are built in. A toolkit invocation with resolved context means
prepare the PRD; an incidental link or quoted mention alone is not an invocation.

Select the specification operation from the actual request:

| Context | Action |
|---|---|
| Resolved idea, no target PRD | Generate the PRD using the generator and selected template |
| Explicit revision/rework of an existing PRD | Use layout/IMPROVE_PRD.md and [the change contract](docs/CHANGE_CONTRACT.md); preserve accepted scope and stable IDs |
| Existing application to rework or bug to fix | Use [the change contract](docs/CHANGE_CONTRACT.md): inspect relevant code and observed evidence, then specify the requested change; distinguish confirmed cause from hypothesis. Do not implement or run side-effecting debugging commands |
| Analyze, brainstorm, review only, or "don't write yet" | Discuss or review only; use layout/VALIDATE_PRD.md for a PRD review; do not create or modify files |
| Bare invocation with an existing PRD but no requested change | Review its readiness; do not overwrite it or invent a rework |
| Missing material product intent | Ask the smallest useful batch of missing material questions; do not fabricate a product or write a generic PRD |

Infer the target from the active project, attached PRD or resolved conversation.
Never save a target PRD inside the toolkit. If the target is ambiguous, ask for
that folder only. Infer whether the requested product work is new development,
rework or a bug fix and state it briefly in the Overview and handoff; this is
context for the specification, not authorization to execute that work.

The default deliverable is PRD.md plus its progress/decision companions,
structural validation, a plain-language summary and the saved product flowchart.
Stop after this handoff. Implementation, application debugging and deployment
belong to a separate builder request. Historical runner/build/audit layouts remain
available for explicit direct use; do not load them during PRD preparation.
Toolkit maintenance requests follow AGENTS.md and PROJECT_CONTEXT.md separately.

Act as the specification foreman: keep one coherent product outcome while
identifying specialist capability the product needs, including visual/UI design,
accessibility, security, domain research, or testing when applicable. If a
relevant specialist skill or tool is available now, read its instructions and
apply it to the specification as needed. Record the capabilities and evidence
the later builder needs; the builder must check its own environment before using
them. A tool name is a preference, not an installed capability or a completed
result. Without specialist support, work within the host model's reasoning,
context, and tool limits; never claim specialist-grade output merely because a
topic appears in the PRD. This toolkit does not supply specialist design,
security, or implementation work by itself.

## Generate

Use the resolved decisions and research already in this conversation. Do not
restart discovery or require `DISCOVERY.md`. Preserve the current scope,
exclusions, evidence, assumptions, interfaces, failure behavior, and acceptance
criteria in the PRD so a fresh reader needs no chat history. Full has 10 sections;
Lite has 6. Keep the detail proportional to the actual product.

Run `node <toolkit>/scripts/validate-prd.mjs <target>/PRD.md --json`, then apply
the [checklist](prompts/PRD_VALIDATION_CHECKLIST.md). Repair findings. A structural
pass does not prove facts or runtime behavior. If local execution is unavailable,
deliver the PRD with the exact checks left UNVERIFIED. Link the saved file rather
than repeating its entire text unless the user asks or files cannot be saved.
Follow the generator's Owner Summary And Product Flow contract: explain the
product in the user's language and show its saved Mermaid flowchart, including
material failure paths. Keep the PRD as the source of truth.

## Context And Efficiency

Allocate effort to the agreed outcome and its required quality. Spend more on
research, specialist capability, specification detail, or verification when
the product needs them; keep straightforward work compact. Choose depth from
material decisions, uncertainty, and consequences of failure. Do not optimize
document length, initial speed, token count, or expense in isolation. Preserve
the full requested behavior and the evidence needed to judge it. Do not claim
an efficiency or quality result that has not been observed.

Read this entry point and the selected operation, not the whole toolkit. Load
the [reliability guide](prompts/RELIABILITY_GUIDE.md) only for relevant risks and
the [research/tool guide](prompts/RESEARCH_AND_TOOL_ROUTING.md) for an unresolved
external decision. Examples, history, adapters, and runner internals are not
routine generation context. Reuse existing code/platforms, omit speculative
features, and preserve full product scope and verification. No extra harness,
compressed wire format, always-on style skill, or agent team is required.

Define each requirement/AC and milestone outcome once; use IDs and local
references elsewhere. The PRD owns static scope, PROGRESS.md owns live evidence
and a concise resume delta. Do not reload the whole project per component step.
One useful diagram may cover several sections; extra diagrams must add distinct
information. Apply reliability controls per actual risk, not a blanket checklist.
