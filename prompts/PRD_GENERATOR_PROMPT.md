# Universal PRD Generator Prompt

Turn the current product conversation into a self-contained, testable PRD for a
fresh builder. This operation writes specifications, not application code.
Use professional English and the smallest design that delivers the complete
requested outcome.

## Input And Scope

Use resolved brainstorming/research decisions and relevant target files.
Do not restart discovery or manufacture DISCOVERY.md. An existing discovery
document is optional evidence, not required builder context. Carry scope,
exclusions, rationale, assumptions, research conclusions with source/date,
prerequisites, and open material decisions into the PRD itself.
Ask one question only if a missing answer changes the outcome materially and
cannot be safely inferred; otherwise disclose the default. Never invent evidence.

Infer the work context from the request: new product, existing-product rework,
or bug-fix specification. Reflect it in the Overview without adding metadata or
new top-level sections. For rework, preserve working behavior and define the
change boundary. For bug fixes, include reproduction evidence, expected/actual
behavior, confirmed cause or hypothesis, and regression acceptance criteria.
Read relevant code as needed; generation never implements the fix. An explicit
analysis-only request overrides generation. Summary, validation and product
flowchart are default outputs even when the invocation is only "Use PRD Maker".

## Select The Template

| Product | Template |
|---|---|
| User-facing app, dashboard, website, mobile or desktop product | `templates/full.md`: 10 sections |
| CLI, script, automation, pipeline, bot, or API without a product UI | `templates/lite.md`: 6 sections |

State the selection and a one-sentence reason. Preserve the selected template's
numbered section names. Scale content to the product, not the example rows.

Full/Lite selects product shape, not effort. A small website still uses Full,
with short sections and only its actual interfaces. Scale depth by distinct
states, domain rules, integrations, recovery paths and consequences of failure.
A static page needs concrete content, interactions, layout and delivery checks;
a simulator needs formulas, independent expected values and boundary cases.
Do not expand a simple product to justify the template. If the user explicitly
requests a lighter scope, preserve that intent and disclose any structural
contract that their requested output no longer satisfies.

## Preparation And Content Budget

Resolve the actual workflow, success criteria, dependencies, and material failure
cases. Do not apply a fixed reasoning ritual or presume auth, databases, queues,
cloud hosting, agents, or enterprise controls are needed.

Allocate effort by the product's desired outcome, material decisions, uncertainty,
and consequences of failure. Give acceptance, domain rules, interaction design,
specialist capability, and verification the depth they need. Keep simple matters
brief when extra detail adds no decision or evidence value. The goal is a complete,
usable specification for this product, not a shorter document, faster first
draft, lower token count, or cheaper initial build. Do not infer overengineering
from document length or planning time alone.

- Define each requirement and acceptance criterion once using stable FR-###,
  NFR-###, and AC-### IDs. Elsewhere reference IDs and local headings instead of
  repeating prose. Retain material inputs, outputs, invariants, and checks.
- Keep visible Layer 1: Human PRD and Layer 2: Machine Spec distinctions without
  repeating two explanations of every feature.
- Use tables for repeated mappings and short prose for single facts. Remove
  unused sample rows; group genuinely inapplicable controls under one specific
  N/A reason. Never use N/A to remove a requested capability.
- Include one useful Mermaid architecture/data-flow diagram. Add user-flow,
  sequence, state, or ER diagrams only for distinct information. Reference an
  existing diagram when it already explains the same behavior.
- Define milestone outcomes and Done When once in the PRD. PROGRESS.md holds
  live state, evidence, and deltas by reference, not a second specification.
- No arbitrary word limit: remove duplication, not build-critical detail.
  Do not copy the transcript, generator, checklist, or entire research results.

## Milestones And Artifacts

Use two milestones for one primary workflow (usable implementation, integrated
audit), or three for a connected product (early usable path, remaining complete
scope, integrated audit). Four requires independently demonstrable outcomes and
written justification; five is an exceptional ceiling, not a target.

Group frontend, backend, data, tests, and docs when they deliver one outcome.
A UI-first milestone is valid for a meaningful testable experience; it must not
leave the complete product disconnected. File/component steps stay an internal
checklist, not separately gated tasks. Use targeted checks while building and
full applicable regression plus real user-path/manual tests, repairs, and reruns
in the final integrated audit.

Create only target PRD.md, PROGRESS.md, and DECISIONS.md by default. Additional
artifacts need a distinct lifecycle, owner, or machine-consumed contract.
Generation does not create TASKS.json or authorize building. New native builds
use the explicit build request as scoped local authority. Existing/requested
runner work retains exact approval and failure rules. Ordinary milestone
transitions need no approval; genuine new authority remains explicit.

## Builder Capability Routing Contract

Keep the selected template's visible builder instructions and six-column routing
table inside Architecture. Point ai_instructions to its local heading anchor.
The PRD must work without toolkit access or chat history.

Use the capability-to-evidence matrix in
`prompts/RESEARCH_AND_TOOL_ROUTING.md#capability-to-evidence-selection` when
choosing verification routes. Copy only applicable decisions into the PRD;
do not copy the catalog or require the builder to have this toolkit. Tool names
are replaceable preferences. Keep the observable acceptance outcome stable.

Fill routes only for material product triggers. The builder must inspect the
host-provided available skill/tool catalog, read matching instructions, check
prerequisites, and record chosen routes, UNAVAILABLE preferences, affected IDs,
and evidence limitations in existing progress and the final audit.
A name in the PRD does not install it or make it callable.
Use repository-native fallbacks without weakening acceptance criteria. Missing
optional tools do not stop independent safe work; missing required verification
cannot pass. Mocks or unperformed manual procedures are not live proof.
Host installation, credentials, external writes, and other new authority are
not granted by naming a tool. Preserve the template's runner no-bypass rule.

## Metadata And Product Contracts

Use the template's YAML frontmatter at line 1 and
`schemas/prd-frontmatter.schema.json`. New PRDs use version 0.1.0, status draft,
current_milestone 0, actual total_milestones, current creation date, and a selected
tech_stack. Mark unresolved selections UNVERIFIED, not several mutually exclusive
technologies masquerading as one choice. Only owner approval means approved.
During building use implementation; advance current_milestone only with verified
evidence, never beyond total_milestones.

The template owns section structure. Populate concrete scope, observable
requirements/ACs, interfaces, data validation, failures, and local start/test
instructions. Label proposed commands and unobserved behavior UNVERIFIED.
For apps retain visual quality, typography, spacing, colors, interaction states,
accessibility, and responsive/platform behavior. Reuse existing design systems.
Do not add dark mode, HTTP APIs, databases, or hosting because a sample suggests
them. Document actual local interfaces when no API exists.

For stateful, connected, background, safety-sensitive, or anti-trial-and-error
work, read `prompts/RELIABILITY_GUIDE.md` and select applicable controls only.
It owns detailed authority, state/recovery, provider/provenance, scheduling,
resource, and source-bound verification rules. Preserve stronger existing rules.
For an unresolved external choice, read `prompts/RESEARCH_AND_TOOL_ROUTING.md`
and verify current primary sources; do not install optional tools by default.

For AI features specify role/authority; models/tools and input/output contracts;
grounding/validation; benchmark cases, measurable pass criteria and human review;
attempt/timeout/rate-limit evidence; and explicit fallback/degraded behavior.
Derive thresholds from product needs, not invented results. Put details beside
the applicable feature, not in a duplicate generic AI specification.

## Quality Gates

Run `node <toolkit>/scripts/validate-prd.mjs <target>/PRD.md --json` after saving,
then apply `prompts/PRD_VALIDATION_CHECKLIST.md` for product judgment. Fix findings;
if execution is unavailable report the exact checks left UNVERIFIED.
These are coverage reminders, not a second report or mandatory reasoning sequence:

1. Frontmatter satisfies the schema and milestone-state semantics.
2. Type, selected template, and 10/6 section names/count agree.
3. No unresolved placeholders, TBD/TODO, or vague filler remain.
4. Human outcomes and machine contracts are visible without duplicated prose.
5. Features have measurable unique ACs. Use selective EARS-style `WHEN [trigger], THE SYSTEM SHALL [observable response]` for event/state/fault/timing cases when clearer, not as compulsory syntax.
6. Material failure and boundary behavior is specified for each feature.
7. Priorities distinguish required implementation scope from deferred options.
8. Mermaid covers actual components/boundaries without invented infrastructure.
9. Data contracts and validation support each applicable capability.
10. UI, API, CLI, webhook, or file interfaces define success and error behavior.
11. Applicable timeout, retry, idempotency, and logging behavior is defined.
12. Only credential variable/store names appear, never secret values.
13. Diagrams are syntactically plausible and non-duplicative.
14. Milestones are outcome-oriented, default 2-3, justified at 4-5, runnable early, automatically continued within authority, and end in integrated audit/repair.
15. MVP, complete requested outcome, and exclusions are realistic and distinct.
16. FR/NFR/AC definitions are unique and stable.
17. Two-way traceability covers all capabilities and IDs, surfaces, milestones, and evidence without empty cells.
18. AI behavior has evaluation cases, pass criteria, bounded authority, and fallback.
19. Applicable reliability controls define evidence, failure classification, environment, and bounded readiness claims.
20. Stateful UIs distinguish current/history/derived state and test applicable complete, partial, empty, historical, and error rendering; static checks are not runtime proof.
21. Providers distinguish configuration/authentication from route/core-flow verification, degradation, limits, unavailability, and staleness.
22. Runtime checks define environment, preflight, side effects, budgets, cleanup, and expected results where applicable.
23. Polling, monitoring, and retention have bounded resource/history behavior.
24. Each AC maps to observable deterministic, integration, runtime, or manual evidence.
25. Embedded builder routing includes concrete capabilities, available preferences, fallbacks, evidence, authority, and startup/completion instructions.

## Traceability Matrix

Fill the selected template's final matrix. Reference canonical definitions and
contracts by ID/local heading, not repeated prose. Every capability and FR/NFR/AC
must map both ways to surfaces, milestone, and required evidence. Use a specific
N/A reason only for a genuinely absent interface/model.

## Governance And Delivery

Initialize target PROGRESS.md and DECISIONS.md from their templates. Preserve
existing decisions and valid evidence; never write target state into toolkit
root logs. The PRD owns the specification, PROGRESS.md owns live execution state,
and DECISIONS.md owns decision changes/rationale. Update affected entries after
feedback; do not regenerate unchanged documents.

Include `### Review Focus` for a material open decision or a specific N/A reason.
Do not force another feedback/approval round for a requested draft.
Check the handoff once as a fresh reader: no dependency on unavailable chat
history, weakened scope, or missing way to start and verify the product.

## Owner Summary And Product Flow

After saving and validating, deliver a concise explanation in the user's
conversation language. Keep the technical PRD in English unless asked otherwise.
Explain who the product serves, what it does, the main scope/exclusions, material
assumptions or blockers, and the first runnable milestone. Distinguish completed
specification work from application behavior that has not been built or tested.

Show one readable Mermaid flowchart of the actual product: actor/trigger → input
→ important decisions/actions → observable result. Include material failure,
recovery and external-approval branches when present in the requirements. Use
plain labels and quoted node text. Do not invent steps to fill a diagram or
substitute the toolkit's brainstorm/generate/build process for the product flow.
Keep the same diagram in the Full User Flow section or Lite Architecture & Data
Flow section. Reuse it verbatim in the summary so the diagram has one source of
truth. A small linear product needs only a small linear diagram. Reference FR/AC
IDs in a nearby sentence when useful; do not crowd every node with identifiers.

When Node.js is available, `node <toolkit>/scripts/preview-prd.mjs <target>/PRD.md`
can extract the saved overview and flow as a read-only handoff starting point.
It does not generate missing content, translate prose, validate Mermaid syntax,
or replace product judgment. Explain the flow in plain text as well for hosts
that do not render Mermaid. Reconcile every branch with the saved requirements;
if a diagram changes, edit the PRD first and rerun structural validation.

Finish with the PRD link, template, actual validation result and next action:
"In the target project, give a fresh builder PRD.md and say 'Build this PRD until
done.'" Keep the summary in the response; no additional SUMMARY.md or duplicate
plan is required. If files cannot be saved, return the complete PRD and bounded
validation result. See examples/prd-handoff-example.md for an illustrative result.
