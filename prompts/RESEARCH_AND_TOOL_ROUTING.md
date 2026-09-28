# Research and Tool Routing

Use the capability-to-evidence section when selecting verification routes.
Use the external research sections only when current evidence or an integration
materially improves a PRD, task plan, implementation, or review. The toolkit's
core generation, validation, and local runner remain dependency-free and need
no account, API key, MCP server, or network connection.

## Lifecycle Tool Map

Use one primary mechanism per phase. A tool may cross phases only when it owns
a distinct capability rather than duplicating the whole workflow.

| Phase | Core mechanism | Optional tool | Adoption rule |
|---|---|---|---|
| Brainstorm and research | Current conversation, local repository evidence, and current primary sources | `layout/DISCOVER_PRODUCT.md` only when evidence must cross conversations or has a distinct lifecycle | Research only decisions that can change scope, requirements, architecture, compatibility, or verification; feed the result directly into PRD generation in the same conversation |
| Create or improve the PRD | Canonical generator, validator, checklist, and selective EARS-style acceptance wording | Reasonix `/prd:generate` or `/prd:improve` as an execution surface | Keep one canonical PRD; use `WHEN/WHILE/IF/WHERE ... THE SYSTEM SHALL ...` only where event, state, fault, or timing behavior becomes clearer |
| Plan and implement | Native host plan and PROGRESS.md; optional runner for requested/existing managed plans | RTK only after a measured noisy-output benchmark | Reuse repository/platform capabilities first; do not add a second planning or orchestration methodology |
| Final integrated audit | `layout/AUDIT_IMPLEMENTATION.md`, full applicable regression, and real behavioral/manual checks | A second model may challenge the evidence, but cannot replace deterministic or runtime proof | Reconcile every FR/NFR/AC ID to current implementation and verification evidence; never sample requirements |

When created, `DISCOVERY.md` contains time-sensitive research evidence that must
survive a conversation boundary. It is not required when brainstorming and PRD
generation share one conversation. `IMPLEMENTATION_AUDIT.md` records
source-state-bound evidence after code changes. Neither duplicates the PRD's
requirements.

## Decision Order

1. Start with the approved PRD, repository, tests, schemas, and local evidence.
2. Identify one unresolved decision whose answer could change requirements,
   architecture, compatibility, or verification.
3. Choose the narrowest source/tool that can resolve that decision.
4. Prefer current primary sources: official documentation, specifications,
   upstream repositories, release notes, and provider contracts.
5. Bound ordinary research to three through five primary sources per unresolved
   decision. Expand only when sources materially conflict or the stakes justify
   it.
6. Record the decision and evidence, then freeze the resolved point. Do not
   repeatedly research it unless material new or disconfirming evidence appears.

Do not use a tool merely because it is available. Tool count, agent count,
document count, and repository count are not quality metrics.

## Routing Matrix

### Capability-to-Evidence Selection

Select capabilities from actual product behavior, then choose the smallest
available tool set that can prove the related ACs. Generation records planned
checks; a separately requested build executes them. Verify host availability
when needed. No package, account, scanner or runtime is installed by this guide.

| Product trigger | Required evidence | Possible route, if available | What does not prove it |
|---|---|---|---|
| User interface and interactions | Exercise core actions and assert resulting state; inspect narrow/wide layouts, focus and keyboard paths | Host browser automation or project E2E tools such as Playwright | Button presence, a screenshot alone, or any arbitrary text change |
| Formulas, derived totals, domain rules | Independent expected values, units, rounding, boundaries and relevant invariants | Existing unit runner, such as Node test or Vitest | Comparing a function only with itself or its own derived output |
| Persistence or backup/restore | Save/reload and round-trip equality; malformed, stale and denied storage recovery when applicable | Unit fixtures plus integrated storage tests in an isolated test context | Corrupting storage without confirming the application reads that key |
| Authentication, permissions or API trust boundary | Positive and denied access, input validation and relevant security checks within authorized targets | Existing API tests, source scanner or scoped dynamic scanner | Scanner score alone, or marking an unexercised attack surface safe |
| External service | Contract tests plus required live route evidence; timeout, invalid response and degradation checks | Provider sandbox, repository integration tests, available service connector | Configuration presence, HTTP 200 alone, or a mock proving live behavior |
| Public delivery requested | Production artifact, startup and relevant route/asset checks on the intended environment | Repository build and hosting tools under actual deployment authority | Development server success as proof of deployed behavior |
| CLI, batch or automation | Exit codes, input/output contracts, side effects and recovery appropriate to its trigger | Native process/file tests; relevant scheduler or provider harness | Browser checks added to a product with no UI |

For responsive checks, measure overflow and inspect whether content or controls
are clipped. Hiding horizontal overflow is not proof of usability; a wide table
may need a contained scroller. Select viewports from stated product support.
For storage recovery, distinguish caught diagnostic logging from uncaught
exceptions and lost data. A zero-console-error rule needs a product reason;
silencing diagnostics must not become the recovery requirement.

Choose one route per needed capability unless another resolves a concrete gap.
A static client may still require input, dependency and DOM safety review;
absence of a backend does not prove security. An interactive UI test does not
replace domain arithmetic tests. Missing required checks remain UNVERIFIED.

Keep presentation choices flexible within accepted requirements. Extra features
that change scope, data or dependencies need a product justification; their
presence is not a quality metric. Record only selected routes and relevant
limitations in the embedded builder contract.

### External Research Routes

| Need | Preferred route | Credential or manual setup | Default policy |
|---|---|---|---|
| Stable behavior already represented locally | Repository, schemas, tests, fixtures | None | Use first |
| Current library or framework API | Context7 or official documentation | Context7 can run at lower limits without a key; `CONTEXT7_API_KEY` is recommended for higher limits. MCP configuration and an app/task restart are manual host setup. | Optional and decision-scoped |
| Public reference implementation | Public GitHub repository or web search, then upstream docs | None for public browsing | Optional; borrow patterns, not whole projects |
| Private repositories, issues, or pull requests | GitHub integration/MCP | OAuth or a scoped token configured outside the repository | Conditional |
| Browser-visible UI behavior | Existing browser/Chrome tooling and project tests | Usually no project key; signed-in browser state may be needed | Conditional |
| n8n node/workflow implementation | Official n8n docs and `n8n-mcp` | Instance URL plus a scoped n8n API key or MCP access token; manual enablement | Only for n8n projects |
| Local static security analysis | Existing project scanner or Semgrep Community Edition | No API key for basic local use; installation and ruleset acquisition may require manual setup/network | Risk-triggered |
| Model-versus-baseline skill evaluation | Deterministic local eval first; AgentSkillsEval only as a pilot | OpenAI-compatible provider key and paid model calls | Optional, never a core dependency |
| Extra long-session tool-output compression | Built-in compaction first; Context Mode only in a controlled benchmark | No external API key, but plugin installation, hook enablement/trust, and restart are manual | Experimental opt-in |
| Noisy test, build, Git, or package-manager output | Direct command first; RTK only in an A/B benchmark that preserves actionable failures | Separate binary and shell/agent integration | Conditional implementation-only optimization |
| Multi-ticket autonomous execution | Existing Codex task runner; Symphony only when a real issue tracker and isolated workspace fleet are required | Tracker credentials, Codex, Git, and separate runtime setup | Not part of the PRD core |

## Evaluated Efficiency Patterns

The following candidates were evaluated from their upstream repositories on
2026-09-02. Popularity is not an adoption criterion and may change after this
date.

| Candidate | Useful capability | Decision for this toolkit | Material reason |
|---|---|---|---|
| [Agent Specification Toolkit](https://github.com/hmbseaotter/agent-specification-toolkit) | EARS-style observable requirements | Adopt the wording pattern locally, without installing the toolkit | Improves event/state acceptance precision while keeping the existing PRD structure and validator |
| [EAI Agent Toolkit](https://github.com/eai-org/agent-toolkit) | Ticket-to-implementation checking | Adopt the conformance-audit pattern locally | Directly closes the PRD-to-code evidence gap without importing a second skill catalog |
| [RTK](https://github.com/rtk-ai/rtk) | Compresses supported command output before it reaches the agent | Optional only after a measured implementation-phase benchmark | It reduces shell-output bytes, not all tokens, and adds a binary/integration surface |
| [Headroom](https://github.com/headroomlabs-ai/headroom) | Tool-output and context compression through proxy, wrapper, or MCP routes | Experimental opt-in, not core | Long-session savings may be useful, but compression can hide diagnostic evidence and adds runtime routing complexity |
| [Superpowers](https://github.com/obra/superpowers) | Full brainstorming, planning, TDD, and review methodology | Do not install for the canonical flow | It duplicates discovery, PRD, planning, execution, and review stages already owned here |
| Ponytail, Caveman, and Honey | Minimality and concise-handoff heuristics | Keep the already adopted principles; do not require their runtimes | The local Reasonix efficiency contract captures the useful behavior without another dependency or workflow authority |

Before adopting an optional optimizer, record a baseline and comparison using
the same representative task. Measure total input, cached input when exposed,
output, retries, elapsed time, preserved actionable failures, and final task
correctness. Include debugging, revisions and human review through the same
acceptance boundary; compare matched scope and quality. More upfront effort may
be worthwhile when it reduces later rework or improves the verified outcome.
Record maintenance benefits as expected until observed, and keep elapsed time
separate from token or monetary cost. Reject the optimizer if it hides relevant
evidence or produces no material end-to-end improvement.

RTK is therefore conditional and Headroom remains experimental; neither is a
prerequisite for discovery, PRD generation, implementation, or audit.

### Rechecked For The Two-Conversation Flow — 2026-09-05

| Candidate | Observed upstream capability | Decision for this toolkit |
|---|---|---|
| [Ponytail skill](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md) | Reuse/stdlib/native-first coding with persistent intensity modes | Keep the useful minimality principles in our existing workflow; do not import persistent mode rules that could shorten requested scope or verification |
| [Caveman](https://github.com/JuliusBrussee/caveman) | Shorter output prose; upstream warns total cost can rise from added input | Plain concise status is sufficient; no always-on installation or claimed session savings |
| [Honey](https://github.com/Green-PT/honey-for-devs) | Code/prose reduction plus optional structured handoff and output-compression tools; upstream reports model-dependent costs | Keep exact contracts and ordinary Markdown/JSON; no new encoding, hooks, or image-rendered source reads without a demonstrated bottleneck |
| [Reasonix](https://github.com/esengine/DeepSeek-Reasonix) | Configurable coding runtime with provider/tool/plugin setup | Retain the existing optional adapter; do not replace the active host or auto-install a second runtime |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | Plugin-oriented runtime; upstream currently labels it developer preview with breaking changes | Optional runtime choice only; adds no required PRD capability to this local flow |
| [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills) | Skills load from supported locations; folder references are not installation | Provide root SKILL.md for explicit use and a PRD-local builder entry; actual installed discovery remains host-dependent |

These are source-review decisions, not comparative end-to-end benchmarks. No
upstream code or skill was vendored, installed, configured, or granted credentials.
The chosen improvement is smaller loaded context and fewer duplicate workflow
steps. Byte/line reductions can be measured locally; token, cost, speed, and
quality improvements across models remain UNVERIFIED until measured on real work.

## Credential Handling

- Never paste a credential into a PRD, tracked config, task plan, runner state,
  evidence receipt, test fixture, shell history example, or user-visible report.
- Store only the environment-variable name or credential-store reference.
- Do not claim a tool is authenticated because its config entry exists. Verify
  `CONFIGURED`, `AUTHENTICATED`, and `ROUTE_VERIFIED` separately when the route
  is needed.
- Configuration changes do not make a new MCP tool callable inside an already
  running agent session. Restart the host app or open a new task after setup.
- Keep access least-privileged and project-scoped. Revoke or rotate credentials
  through the provider, not through toolkit files.

## Reference-Reuse Rule

When inspecting another project, extract only a named pattern that satisfies a
current requirement, such as workspace isolation, task budgeting, an adapter
contract, or a verification receipt. Before adoption, check license,
maintenance status, runtime compatibility, security boundary, and integration
cost. Never merge an entire repository merely because the product description
looks similar.

## Default Rejections

- Do not split one canonical PRD into PRD, SRS, SDD, UI spec, and task documents
  by default. Create a linked artifact only when it has a distinct owner,
  lifecycle, audience, or machine-consumed contract that would otherwise make
  the PRD materially harder to use.
- Do not create permanent research, planning, architecture, UI, QA, and security
  agents for every project. Use a specialist only when the task's risk or
  evidence requires one; unsupported percentage-saving claims remain
  `UNVERIFIED`.
- Do not install Paperclip, Goose, a third-party Codex team orchestrator, or a
  full orchestration platform merely to generate or execute one local PRD.
  They duplicate the active runtime and add setup, credentials, or governance
  surface without fixing poor task granularity.
- Do not install Superpowers, Headroom, RTK, or another compression/methodology
  layer by default. First prove a specific bottleneck and benchmark the narrowest
  reversible option against correctness, failure visibility, and total usage.

## Completion Report

For every externally researched decision, report:

- question resolved;
- primary sources consulted;
- adopted pattern and why it fits;
- rejected alternatives and material reason;
- credential/setup status without secret values;
- remaining `UNVERIFIED` items;
- whether any repository or host configuration was actually changed.
