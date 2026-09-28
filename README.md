# PRD Maker / PRD Toolkit

Turn one product conversation into a self-contained PRD, then give that PRD to
a fresh coding conversation to build the product. The toolkit supplies prompts,
Full/Lite templates, structural checks, and an optional stateful runner. It has
no package dependencies. A capable coding host does the reasoning and execution.

Use any local checkout path. Substitute your actual toolkit path wherever the
examples show `/absolute/path/to/prd-toolkit`. For a clean Git checkout, follow
the [distribution guide](docs/DISTRIBUTION.md).

## Get Started

Download this repository using **Code → Download ZIP**, or copy the clone URL
from the repository's **Code** menu and run `git clone` with it. Extract/open the
checkout in your preferred coding agent. Node.js 20+ runs the checks; no
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

## Use It After Your Discussion

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
