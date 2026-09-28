# PRD Maker / PRD Toolkit

Turn one product conversation into a self-contained PRD, then give that PRD to
a fresh coding conversation to build the product. The toolkit supplies prompts,
Full/Lite templates, structural checks, and an optional stateful runner. It has
no package dependencies. A capable coding host does the reasoning and execution.

Use any local checkout path. Substitute your actual toolkit path wherever the
examples show `/absolute/path/to/prd-toolkit`. For a clean Git checkout, follow
the [distribution guide](docs/DISTRIBUTION.md).

## What This Toolkit Does

**PRD Maker is the specification coordinator** at the start of a project. It turns
the agreed outcome into requirements, acceptance criteria, a product flow, and a
plan for what evidence the eventual builder must collect. It names specialist
capabilities when the product needs them, such as UI/UX design, accessibility,
browser testing, security, or domain-specific research. The builder then uses
available specialist tools and project code to deliver and verify those parts.

**Specialist tools remain conditional.** This toolkit does not contain or install
them. A PRD that mentions UI/UX does not by itself produce a polished interface.
The agent must check which tools are actually available, choose an appropriate route or fallback,
and leave any unmet requirement unverified rather than claim it is done.

**Efficiency means value across the project lifecycle.** Judge the delivered
scope, quality, and reliability against the total time, tokens, money, and human
effort spent on planning, building, testing, debugging, revisions, and maintenance.
More work upfront can be worthwhile when it clarifies a costly decision, exposes
a failure case, or prevents building the wrong thing.

**Proportional effort, complete outcomes.** Invest detail where uncertainty or
failure consequences justify it. Reuse settled decisions and avoid duplicated
work. A short PRD can leave expensive gaps; a long PRD can add ceremony. Project
size, document length, and initial speed alone do not establish value.

The intended benefit is better decisions and less avoidable rework. Measure it
against comparable scope and quality over the whole workflow. This toolkit does
not guarantee fewer bugs, lower total cost, or any fixed saving.

## Start With A Link, Clone, Or ZIP

After discussing the product in a coding agent that can access GitHub and local
files, one sentence is enough:

```text
Use PRD Maker from https://github.com/yanuarihsanxz-tech/prd-toolkit.git for this project.
```

The agent should fetch the **complete repository**, read its `SKILL.md`, use the
current conversation as input, and stop after the validated PRD, summary, and
product flowchart. A URL mention alone is a reference; it does not grant network
access, install a skill, or authorize a build. If the agent cannot fetch files,
clone or download the ZIP yourself and point it at the local `SKILL.md`.

Download this repository using **Code → Download ZIP**, or copy the clone URL
from the repository's **Code** menu. For this public repository:

```bash
git clone https://github.com/yanuarihsanxz-tech/prd-toolkit.git
```

Open the checkout in your preferred coding agent. Node.js 20+ runs the checks; no
`npm install`, API key, paid service, or additional workflow plugin is needed.

From the checkout directory:

```bash
npm run check
node scripts/validate-prd.mjs examples/tool-prd-example.md --json
node scripts/preview-prd.mjs examples/tool-prd-example.md
```

To generate a PRD, give your agent the checkout's `SKILL.md` and the resolved
product requirements. The agent must have file access; generation is performed
by your coding host, not by the validator CLI. Keep your target project in its
own directory. Unfilled templates are starting points, not finished PRDs.

## Use A Local Checkout After Your Discussion

In your target project's conversation, discuss the idea, rework or bug until the
intended outcome is clear. Then mention this checkout and say:

```text
Use this PRD Maker.
```

Or point directly to its entry file:

```text
Use /absolute/path/to/prd-toolkit/SKILL.md.
```

The agent reads the conversation, selects Full/Lite, prepares the target PRD,
validates it, and returns a summary and product flowchart automatically. You do
not need to request each output. See the [worked handoff](examples/prd-handoff-example.md).
The technical document defaults to English; the explanation follows your language.

Say "analyze only" to get analysis without file changes, or "revise this PRD" to
update an existing specification. For a rework or bug-fix project, the agent
inspects relevant evidence and specifies the change. This PRD entry stops at the
specification handoff; it does not implement or debug your application.

An existing PRD is reviewed rather than overwritten when no change is requested.
Only a missing material decision or ambiguous target folder needs clarification.
The host must be able to read the toolkit files; a mention is not an installation.

## What Changes In Practice

These examples show what a useful specification should clarify. The PRD records
the decisions and planned checks; a separately requested build must supply the
runtime evidence. Include each concern only when it applies to the product.

| Situation in the brief | What PRD Maker should clarify | Evidence the builder should collect |
|---|---|---|
| **Unclear scope:** "Build a dashboard." | Who uses it, which decisions it supports, required actions, and exclusions | Agreed workflows work; excluded features have not displaced required scope |
| **Vague UI/UX:** "Make it polished and mobile-friendly." | Core journeys, content hierarchy, interaction states, accessibility needs, supported layouts, and any specialist design route | Inspect actual layouts and exercise core actions with appropriate input methods |
| **Hidden failure cases:** "Save my favorites." | Persistence location, reload behavior, malformed data, and what happens when storage is unavailable | Save/reload succeeds; applicable failure cases produce the specified recovery |
| **Domain logic:** "Calculate the result." | Inputs, units, formulas, rounding, boundaries, and unresolved domain assumptions | Compare results with independent expected values and relevant edge cases |
| **Existing-product rework:** "Change this flow." | Current behavior, requested differences, dependencies, and behavior to preserve | Verify the changed flow and relevant regression paths |
| **Specialist tools:** "Use a design or security tool." | Required capability, available route or fallback, and the acceptance evidence it must support | Demonstrate the required outcome; a tool name or successful launch is insufficient |
| **Handoff or later changes:** "Another agent will build it." | Scope, decisions, stable requirement IDs, interfaces, and acceptance criteria in the PRD | The builder can trace implementation and checks to the agreed requirements without reconstructing the chat |

### A Brief-To-Specification Example

**Brief:** "Let visitors save favorite assets."

Suppose the discussion establishes browser-local storage, no login, and an
explicit recovery action for unreadable saved data. A useful PRD then states:

> Visitors can add and remove favorites. Saved selections persist after a page
> reload in the same browser. If saved data cannot be read, the app explains the
> problem and offers a reset action. Resetting requires the visitor's action.

The builder can test add, remove, reload, and the recovery action. If the intended
product instead needs account sync, that decision changes the specification.
The toolkit must resolve material ambiguity rather than invent a storage model.

This is an illustrative specification, not a measured bug-reduction result.
See the [complete app PRD](examples/app-prd-example.md), the
[tool PRD](examples/tool-prd-example.md), and the
[summary and flowchart handoff](examples/prd-handoff-example.md) for worked examples.

## After The PRD

When you choose to build, hand PRD.md to a separate coding conversation and
explicitly request implementation. The document contains the builder handoff;
you do not need to invoke this toolkit again. Existing optional runner utilities
are retained for compatibility and are not part of normal PRD preparation.

## What The Agent Reads

Start with [SKILL.md](SKILL.md), then only the selected generation, improvement
or review route. The [generator](prompts/PRD_GENERATOR_PROMPT.md) owns generation;
[Full](templates/full.md) and [Lite](templates/lite.md) own document structure.
See [contribution guidance](docs/CONTRIBUTING.md) for toolkit maintenance.

The `.reasonix/commands/prd/` folder is an optional adapter for people who
already use the Reasonix agent runtime. Its seven slash commands call the same
toolkit operations; ordinary PRD Maker use does not need Reasonix. See the
[adapter guide](docs/REASONIX_ADAPTER.md) only if you use that runtime.

## Verification And Limits

```bash
npm run check
node scripts/validate-prd.mjs /absolute/path/to/PRD.md --json
```

Node.js 20+ runs the dependency-free checks. They validate structure and local
contracts, not product feasibility, live skill availability, or universal agent
reliability. The checklist and final product audit supply separate evidence.

Folder mentions are references, not installation or guaranteed automatic skill
activation. The agent must be able to read the folder and follow [SKILL.md](SKILL.md).
If directory attachments are ambiguous, mention that file directly. A fresh
builder with filesystem and execution tools can use the embedded PRD instructions;
a text-only model cannot run or verify your application.

Local baseline: **3.1.2**. See [changes](CHANGELOG.md), [compatibility](BASELINE.md),
and [first-use details](docs/GETTING_STARTED.md). Local validation does not prove
hosted CI, deployment, or production acceptance.

## Contribute

Start with a confusing instruction, a minimal PRD that exposes a validator bug,
or a sanitized example that makes the flow easier to understand. See
[your first contribution](docs/CONTRIBUTING.md#your-first-contribution).
Use the repository's Issues page for bugs and focused improvement proposals.
Issue and pull-request templates ask for reproducible evidence and compatibility
impact. No additional workflow framework is needed.

## License

[MIT](LICENSE). Contributions are welcome; see [Contributing](docs/CONTRIBUTING.md).
