# PRD Validation Checklist

Use this checklist to review any generated or human-written PRD. Score evidence, not intent. If a section is not applicable, it must include a specific reason.

## Scoring

| Score | Meaning |
|-------|---------|
| 2 | Complete, specific, and implementation-ready |
| 1 | Present but incomplete, vague, or missing evidence |
| 0 | Missing, contradictory, or unusable |

## Applicability And Score Calculation

Determine applicability before assigning points:

1. Structure (`S`) and Quality (`Q`) checks are applicable by default. Exclude
   one only when its own wording is conditional and the PRD gives a specific,
   factually consistent reason; for example, Q11 may be excluded when the
   product has no AI behavior. A triggered Mandatory Blocker cannot be excluded.
2. Score exactly one template group: Full (`F`) for a Full PRD or Lite (`L`)
   for a Lite PRD. Exclude the unselected template group from the denominator.
3. Evaluate Reliability (`REL`) applicability per check, not all-or-nothing.
   State, external connections, background processing, safety sensitivity, or an
   explicit reliability request triggers review of this group, not compulsory
   implementation of every control. For example, local persistent state alone
   does not require providers, schedulers, sessions, or notification delivery.
   Exclude individual untriggered REL checks with specific reasons; never exclude
   a control whose risk or requested behavior is actually present.
4. Include AI (`A`) checks only when the product contains an AI decision,
   model, agent, classifier, extractor, recommender, RAG, or media-generation
   step.
5. A valid `N/A` requires `N/A - [specific reason]` and is excluded from both
   points earned and points possible. A bare, circular, or contradicted `N/A`
   is invalid and scores `0`; if it hides a mandatory blocker, the blocker also
   applies.

Calculate the score exactly as follows:

```text
applicable_check_count = count(included S) + count(included Q) + count(selected F/L) + count(included REL) + count(included A)
points_earned = sum(the 0, 1, or 2 score for every included check)
points_possible = applicable_check_count * 2
percent = round((points_earned / points_possible) * 100, 1)  # round only this final value
```

Report earned/possible points for each included group. Group excluded check IDs
sharing the same reason; do not reproduce blank checklist tables or every passing
row. Cite the PRD's existing evidence and traceability, not a second copied matrix.
The percentage determines
the threshold verdict, but any Mandatory Blocker overrides the percentage and
forces `Major gaps`.

## Verdict Rules

| Score | Verdict |
|-------|---------|
| `>= 90.0%` and no blockers | Ready for development |
| `>= 75.0%` and `< 90.0%`, with no blockers | Needs revision |
| `< 75.0%` or any blocker | Major gaps |

## Mandatory Blockers

Any blocker forces `Major gaps` until fixed:

- Missing YAML frontmatter.
- Wrong template section count.
- No measurable acceptance criteria.
- No architecture or data-flow diagram.
- Ordinary phase/layer transitions incorrectly require owner approval, or real
  external/high-risk/production authority boundaries are not explicit.
- More than five milestones/tasks, unjustified use of four or five, microtask
  decomposition, or no final integrated audit
  that includes full applicable regression and real behavioral/manual product
  testing.
- Any `FR-###`, `NFR-###`, or `AC-###` is duplicated, malformed, or missing
  required two-way traceability.
- Traceability matrix has empty cells without `N/A - [specific reason]`.
- Secrets or tokens appear directly in the PRD.
- AI-powered feature exists but has no evaluation strategy or pass criteria.
- A safety-sensitive or side-effecting feature has no authority/mode boundary or
  forbidden-side-effect test.
- A runtime completion claim has no source-state-bound evidence or names a
  higher readiness level than its evidence supports.
- No Builder Capability Routing Contract exists, it assumes a named skill is
  callable without inspecting the builder host, or it lacks a safe fallback and
  authority boundary.
- Material product decisions, research conclusions, prerequisites, or the local
  start/verification path exist only in an unavailable conversation or reference.
- A fallback weakens an acceptance criterion or substitutes mock/static evidence
  for required live behavior without leaving the affected IDs UNVERIFIED.

## Automated Structural Preflight

When the PRD exists as a local file and Node.js is available, run this before
manual scoring:

```bash
node /absolute/path/to/prd-toolkit/scripts/validate-prd.mjs \
  /absolute/path/to/PRD.md --json
```

The command deterministically checks canonical frontmatter semantics, selected
template section names/count, unresolved placeholders, credential-like values,
local Markdown links, Markdown fences, Mermaid directives, FR/NFR/AC definition uniqueness,
requirement-to-acceptance pair symmetry, traceability set coverage and cells,
milestone totals/status/gates, Two-Layer markers, and Review Focus presence.
Builder routing must be one visible subsection inside Architecture, with its
own six-column table, concrete cells, and local availability instructions.
Comments, fenced examples, and tables elsewhere cannot satisfy that contract.

- Exit `0`: those structural checks passed.
- Exit `1`: one or more validation findings exist.
- Exit `2`: usage, file access, or the bounded input budget prevented a result.

Preserve the emitted finding codes and file/line evidence in the report. Never
convert a structural pass into checklist points automatically: applicability,
specificity, factual correctness, feasibility, evidence truth, conditional
Reliability/AI coverage, and readiness claims still require this checklist.

## Structure Checks

| # | Check | Score | Evidence |
|---|-------|-------|----------|
| S1 | YAML frontmatter validates against `schemas/prd-frontmatter.schema.json`; `current_milestone <= total_milestones`; a new unapproved PRD uses `status: draft` and `current_milestone: 0` | | |
| S2 | Detected type matches template: app uses Full, tool/automation/CLI uses Lite | | |
| S3 | Full PRD has exactly 10 sections or Lite PRD has exactly 6 sections | | |
| S4 | Two-Layer Design separates human intent from machine constraints | | |
| S5 | No unresolved placeholders, TBD, TODO, or vague filler | | |

## Full Template Checks

| # | Check | Score | Evidence |
|---|-------|-------|----------|
| F1 | Overview includes problem, solution, target users, goals, metrics | | |
| F2 | Requirements include priorities, rationale, constraints, non-functional needs | | |
| F3 | Core features include measurable criteria and failure behavior | | |
| F4 | User Flow explains actions, responses, and material failure/boundary cases; a referenced Architecture diagram may cover the same flow without a second diagram | | |
| F5 | Architecture includes a system/data-flow diagram and selected stack; add separate sequence detail only for meaningful ordering/concurrency, and credential names only when applicable | | |
| F6 | Data Models support all features and include validation rules | | |
| F7 | Design System defines typography, colors, states, responsive/performance targets | | |
| F8 | API Spec or interface contract is explicit with error format | | |
| F9 | File Map is concrete enough for an AI coding agent to create files | | |
| F10 | Milestones are outcome-oriented, default to 2-3 total including final integrated audit, justify any fourth/fifth task, make the product runnable early, define Done When and the complete summary contract, and gate only real new authority | | |

## Lite Template Checks

| # | Check | Score | Evidence |
|---|-------|-------|----------|
| L1 | Overview defines trigger, inputs, outputs, operators, and done state | | |
| L2 | Requirements cover applicable auth/secrets, logging, idempotency, retries, and constraints; omitted controls have specific consistent reasons | | |
| L3 | Architecture & Data Flow includes Mermaid flow and component contracts | | |
| L4 | Implementation & Milestones default to 2-3 outcome tasks including final integrated audit, justify any fourth/fifth task, make the tool runnable early, include runtime checks, and gate only real new authority | | |
| L5 | Risks include failure modes, detection, recovery, and owner | | |
| L6 | Progress distinguishes Not Started, In Progress, Verified, and owner Approved; ordinary authorized native or runner milestones continue automatically | | |

## Quality Checks

| # | Check | Score | Evidence |
|---|-------|-------|----------|
| Q1 | Requirements and acceptance criteria use unique, well-formed `FR-###`, `NFR-###`, and `AC-###` IDs | | |
| Q2 | Every feature/capability maps to at least one applicable FR/NFR ID and AC ID, and every FR/NFR/AC ID maps back to a feature/capability | | |
| Q3 | Every feature/capability maps to data and an API, CLI, webhook, workflow, bot, UI, or file interface—or an explicit N/A reason | | |
| Q4 | Every interface defines success and error behavior | | |
| Q5 | Security model is explicit, including credentials and authorization | | |
| Q6 | Validation rules cover required inputs and invalid values | | |
| Q7 | Timeout, retry, duplicate submission, and empty-state behavior are covered | | |
| Q8 | Mermaid diagrams are syntactically plausible and use Mermaid code fences | | |
| Q9 | MVP scope is realistic and future/out-of-scope items are separated | | |
| Q10 | Decisions and assumptions are explicit enough to avoid re-debate | | |
| Q11 | AI-powered features define tools/APIs, input/output contract, evaluation strategy, benchmark set, pass rate, and fallback behavior | | |
| Q12 | Review Focus identifies material owner questions or explains that none remain; it does not force another feedback round | | |
| Q13 | Operational, dashboard, audit, and retention behavior has bounded resource and history limits | | |
| Q14 | Status words such as configured, verified, deployed, running, exercised, and accepted have distinct evidence | | |
| Q15 | The implementation plan groups code layers by user/operator outcome, avoids microtasks, uses targeted milestone checks, exposes an early runnable product, continues under native build authority or runner plan approval, and reserves full regression plus real behavioral/manual testing for the final integrated audit | | |
| Q16 | Event, state, fault, optional-feature, and timing acceptance criteria identify a trigger or condition plus an observable system response; EARS-style wording is used selectively where it improves clarity rather than as ritual | | |
| Q17 | Builder Capability Routing Contract maps each material trigger to required capability, preferred available skill/tool, repository-native fallback, evidence, and authority; missing preferred routes are marked UNAVAILABLE; the builder reads matched instructions and records affected IDs without weakening acceptance evidence | | |

## Reliability Extension Checks

Score each triggered check when the project has relevant state, providers,
background processes, safety-sensitive behavior, or reliability needs. Group
untriggered IDs under `N/A - [specific reason]`; do not invent features to score
them. A tiny local state file does not imply a distributed event pipeline.

| # | Check | Score | Evidence |
|---|---|---:|---|
| REL-01 | Source-of-truth hierarchy and conflict handling are explicit | | |
| REL-02 | Requirements map to observable implementation and verification evidence | | |
| REL-03 | Safety invariants have negative tests and forbidden side effects are explicit | | |
| REL-04 | State transitions, restart/recovery, idempotency, retries, and uncertain outcomes are defined | | |
| REL-05 | External/data contracts define units, provenance, freshness, ambiguity, and compatibility | | |
| REL-06 | Mocks/fixtures preserve the production property under test and cover boundaries | | |
| REL-07 | Every check has an environment, failure classification, timeout, and cleanup expectation | | |
| REL-08 | Completion claims use a source-state-bound verification receipt and explicit readiness level | | |
| REL-09 | Authority and mode matrices define permitted/forbidden side effects and operator authorization | | |
| REL-10 | Immutable events, authoritative current state, historical state, derived analytics, and UI/API projections are distinct | | |
| REL-11 | Provider status distinguishes configuration, authentication, required-route/core-flow proof, optional degradation, limits/cooldown, unavailability, and staleness | | |
| REL-12 | Producer/consumer contracts separate event ID, payload hash, business identity, merge scope, replay, and conflict behavior | | |
| REL-13 | Schedulers define alignment, atomic claims, deadline, cancellation, cleanup, lock/child release, and next-run behavior | | |
| REL-14 | Polling records provider observation time/new-data identity; notifications are decoupled from business persistence | | |
| REL-15 | Sessions/processes reconcile supervisor, PID, port, persistence, health, carry-over, and current/all-time accounting | | |
| REL-16 | Runtime smoke and operator handoff define preflight, side-effect/resource budgets, post-checks, cleanup, and exactly one next action | | |
| REL-17 | Stateful UI/API projections have a bounded browser smoke matrix for complete current, historical, partial/legacy, empty, and error payloads as applicable; the artifact mounts without uncaught browser exceptions and static build/HTTP 200 is not treated as sufficient proof | | |

## AI System Checks If Applicable

Score this section only when the PRD includes LLMs, agents, classifiers, extractors, RAG, voice/image/audio generation, recommendations, or AI-based routing.

| # | Check | Score | Evidence |
|---|-------|-------|----------|
| A1 | AI role is explicit: what the model decides, generates, extracts, classifies, or routes | | |
| A2 | Required tools, APIs, models, retrieval sources, or workflow nodes are listed | | |
| A3 | Input and output schemas are concrete enough to test | | |
| A4 | Evaluation strategy includes benchmark cases or human review criteria | | |
| A5 | Pass criteria are quantified, such as target accuracy, precision, latency, or zero critical failures | | |
| A6 | Fallback behavior is defined for low confidence, provider failure, invalid output, or safety failure | | |
| A7 | AI authority is bounded and cannot override deterministic safety or grant permission on unavailable/invalid output | | |
| A8 | Grounding defines canonical facts, aliases, units, numeric normalization, and citation/value validation | | |
| A9 | Provider/model attempts, rate limits, `Retry-After`, circuits, and explicitly configured fallbacks are observable | | |

## Traceability Matrix

Inspect the PRD's canonical matrix in place. Report only missing/contradictory
links with affected IDs; do not create another full matrix. A passing structural
coverage check does not prove the referenced behavior or evidence is meaningful.

## Gap Report Format

Use this report format after scoring:

```markdown
PRD Quality Score: [points]/[max] ([percent]%)
Verdict: Ready for development | Needs revision | Major gaps

Group subtotals:
- Structure: [earned]/[possible]
- Full or Lite: [earned]/[possible]
- Quality: [earned]/[possible]
- Reliability: [earned]/[possible or excluded with reason]
- AI: [earned]/[possible or excluded with reason]

Excluded checks:
- [Check ID] - N/A - [specific reason]

Blockers:
- [None or blocker list]

Highest-impact gaps:
1. [Gap] - [Why it matters] - [Fix]
2. [Gap] - [Why it matters] - [Fix]
3. [Gap] - [Why it matters] - [Fix]

Evidence checked:
- YAML frontmatter: [pass/fail]
- Section count: [pass/fail]
- ID uniqueness and two-way traceability: [pass/fail]
- Mermaid diagrams: [pass/fail]
```
