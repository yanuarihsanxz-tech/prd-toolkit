# PRD Toolkit

The PRD foreman for AI coding agents: testable specifications, specialist routing,
revision comparison, and a clear builder handoff. Generation uses your model;
structural validation and comparison are deterministic. No package dependencies.

Turn a product conversation or an existing-product issue into a self-contained,
testable specification that a fresh builder can use.

**Brief:** “Let visitors save favorite assets.” After agreeing on browser-local
storage, no login and user-controlled reset, the PRD specifies add/remove,
persistence after reload, unreadable-data recovery and the checks for each.
See the [worked summary and flowchart](examples/prd-handoff-example.md).

## Try It

Clone the public toolkit and check it:

```bash
git clone https://github.com/yanuarihsanxz-tech/prd-toolkit.git
cd prd-toolkit
npm run check
node scripts/validate-prd.mjs examples/tool-prd-example.md
```

You can also use GitHub's **Code → Download ZIP** and run these checks from the
extracted toolkit folder. For an exported portable archive, use its `prd-maker/` directory.
Verify its checksum and content manifest using the [distribution guide](docs/DISTRIBUTION.md).
See [verification evidence](evals/release-3.2.0.md) for the current scope and limits.

Node.js 20+ runs these terminal commands; no npm install or API key is needed.
They check the toolkit and an existing example. To **generate** a specification,
use your coding agent in a separate target project after discussing the outcome:

```text
Use /absolute/path/to/prd-toolkit/SKILL.md to prepare this project's PRD.
```

If your agent can fetch repositories, you can instead say:

```text
Use PRD Maker from https://github.com/yanuarihsanxz-tech/prd-toolkit.git for this project.
```

The agent needs the complete toolkit and reads its `SKILL.md`. When repository
access is unavailable, supply the local checkout path above.

The agent reads the conversation, chooses Full/Lite, writes PRD.md and its
progress/decision companions, validates, and returns a summary and product flow.
It ends at the specification handoff. In a fresh chat, “Build this PRD until
done” authorizes the separate build workflow. A validator does not generate
requirements or grant authority.

| Your intent | Entry |
|---|---|
| New product specification | [SKILL.md](SKILL.md), then the generator and selected template |
| Change an existing product or fix a bug | Same entry plus [change contract](docs/CHANGE_CONTRACT.md): current evidence, delta, preserved behavior and original reproducer |
| Revise a PRD | [Improve](layout/IMPROVE_PRD.md), preserving IDs and retirement history |
| Review only | [Validate](layout/VALIDATE_PRD.md); no file changes |
| Compare two revisions | `node scripts/compare-prd.mjs old.md new.md --json --fail-on-removal` |
| Install as a discoverable skill | [Installation](docs/GETTING_STARTED.md#folder-references-and-installed-skills) |

Use your real checkout path in place of `/absolute/path/to/prd-toolkit`. A URL
or folder mention requires actual host file access; it does not install a skill.

## What This Toolkit Does

**Think of PRD Maker as the foreman for the specification.** It turns the agreed
outcome into requirements, acceptance criteria, a product flow, and a plan for
what evidence the eventual builder must collect. It identifies where specialists
are needed and plans how their contribution fits the specification or build.

| Role | Responsibility |
|---|---|
| **PRD Maker (foreman)** | Define the product outcome, route specialist needs, record decisions and acceptance evidence, and hand a coherent PRD to the builder. |
| **Relevant specialists** | Bring focused capability when available: for example visual/UI design, accessibility, security, browser testing, or domain research. Their work informs the PRD or the later build. |
| **Builder** | Implement the authorized product and verify it against the PRD, using applicable specialist tools and project code. |

**Used on its own, PRD Maker still works, but its output depends on the coding
agent's model, reasoning effort, available context, and host capabilities.** It
is not a built-in team of design and security experts. Adding relevant skills or
tools can change the depth of those parts when the agent can actually access and
apply them; their presence alone does not guarantee a result.

**Specialist tools remain conditional.** This toolkit does not contain or install
them. A PRD that mentions UI/UX does not by itself produce a polished interface.
The agent must check which tools are actually available, use a relevant one or
record a suitable route for the builder, and leave any unmet requirement
unverified rather than claim it is done.

**Efficiency means putting effort where the product needs it.** The goal is the
agreed outcome at its required quality, with evidence that it works. A project
may need substantial research, design, specialist tools, implementation, and
testing. Another may need only a compact specification and a direct build. Time,
tokens, money, and human attention are resources to allocate, not numbers the
toolkit tries to minimize independently.

**Proportional planning serves the whole result.** Clarify decisions and failure
paths that matter, preserve required behavior, and choose verification suited
to the product. Reuse settled context and avoid work that adds no decision or
evidence value. Neither the shortest PRD nor the cheapest first build is a
success when it misses the user's outcome. The toolkit makes no universal
promise about effort or product quality; both depend on the project and its
execution.

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

Local baseline: **3.2.0**. See [changes](CHANGELOG.md), [compatibility](BASELINE.md),
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
