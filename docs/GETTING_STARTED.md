# Getting Started with the PRD Toolkit

## Two Conversations

Start in the target project folder, not the toolkit folder. Use the capable
model and coding host you already have. Models help reason; the host supplies
filesystem, terminal, browser, and other execution capabilities.

**Conversation A, if material decisions remain:** say `Research and brainstorm only. Do not generate a
PRD or build yet.` Work through the user outcome, scope, constraints, and material
unknowns. Current claims should have primary-source evidence when needed.

**Conversation A, after decisions:** mention the toolkit folder or its SKILL.md
and say `Use PRD Maker.` The entry reads your conversation, infers new/rework/bug-fix
specification context, selects the template, validates, and returns PRD.md plus
progress/decisions, a summary and the saved product flowchart automatically.
No application code is changed. Say `analyze only` when you want discussion or
review without writing; say `revise this PRD` for an existing specification.

Only missing material context or an ambiguous target folder requires a question.
See the [example handoff](../examples/prd-handoff-example.md). The optional
`node scripts/preview-prd.mjs /absolute/path/to/project/PRD.md` command prints
an existing overview and flow; the agent's normal summary requires no manual CLI.

**Conversation B:** open a fresh conversation in the same project, attach
`PRD.md`, and say `Build this PRD until done.` The PRD carries its own builder
entry through `ai_instructions: "#builder-capability-routing-contract"`.
The builder plans, implements, tests the real user path, fixes defects, and
writes `IMPLEMENTATION_AUDIT.md`. Native local building uses this explicit build
instruction as authorization, so a second ordinary approval is unnecessary.

A file attachment alone is not a build instruction. Research-only and review-only
requests remain read-only. External writes, destructive actions, purchases,
credential changes, deployment, and production still require explicit authority.

## Expected Handoff Quality

The PRD contains the decisions, exclusions, assumptions, research conclusions,
interfaces, data, failures, acceptance criteria, prerequisites, and local
start/verification path a fresh builder needs. FR/NFR/AC IDs remain stable and
map to implementation surfaces, milestones, and required evidence in both
directions. Full retains 10 sections; Lite retains 6, with project-sized detail.

Capabilities are selected from the actual environment. Named tools are conditional
preferences; the builder reads matching skill instructions and follows safe
fallbacks. An unavailable optional skill is not a product blocker. Missing
required behavior or live evidence is a blocker to claiming that part complete.

## Optional Stateful Runner

Use `Use runner mode` only when you want persisted plan fingerprints, attempts,
checks, and ordering beyond the host's normal plan/progress. This creates
`TASKS.json` and `.prd/task-state.json`; the agent reads
[the complete runner guide](../prompts/PHASE_GATED_TASK_RUNNER.md), shows the exact
plan, and records one owner approval. `AUTORUN` retains the guide's existing
meaning for a current runner plan. Ordinary milestones then continue automatically.

Existing runner plans/state do not migrate silently. Plan changes invalidate
old approval; failed tasks remain blocked until resolved. Missing runner access
must be restored before managed execution resumes. Native mode is not an escape
from a runner checkpoint.

## Folder References And Installed Skills

A directory reference exposes toolkit files; it does not install a skill. The
portable directory must include every canonical resource, not just SKILL.md.
The skill name is `prd-maker`, so use that directory name for installation.

From a verified checkout, export into a new project-local skill directory:

```bash
node /absolute/path/to/prd-toolkit/scripts/export-toolkit.mjs /absolute/path/to/target/.agents/skills/prd-maker
node /absolute/path/to/target/.agents/skills/prd-maker/scripts/validate-toolkit.mjs --json
```

Codex documents project discovery from `.agents/skills` and supports symlinked
skill directories. Start a new target chat and explicitly invoke `$prd-maker`,
or ask to prepare a PRD. See [official Codex skill discovery](https://learn.chatgpt.com/docs/build-skills).

For Claude Code, export instead to `target/.claude/skills/prd-maker`, then
invoke `/prd-maker`. This path and invocation follow
[Claude Code's skill documentation](https://code.claude.com/docs/en/skills).
The [Agent Skills format](https://agentskills.io/specification) requires the
skill name to match its parent directory. CLAUDE.md forwards maintainer
instructions to AGENTS.md; it is not a second generation workflow.

Exports refuse to overwrite an existing directory. For an update, export into
a new staging directory, verify it, retain the old version for recovery and
replace the installed directory deliberately. No host settings, credentials or
model choice need changing. Explicit file invocation remains available when
automatic discovery is unavailable. See [verification evidence](../evals/release-3.2.0.md)
for which installation and generation paths were actually exercised; a documented
path or copied directory alone does not prove host discovery.

No Ponytail, Caveman, Honey, Reasonix, or DeepSeek Harness installation is required.
The [research/tool policy](../prompts/RESEARCH_AND_TOOL_ROUTING.md) records which
principles help and why optional tools must justify their added context/setup.

## Verify Locally

```bash
cd /absolute/path/to/prd-toolkit
npm run check
node scripts/validate-prd.mjs /absolute/path/to/project/PRD.md --json
```

Node.js 20+ is needed for these checks, with no package install. Structural
preflight uses exit 0 for pass (warnings allowed), 1 for blocking/error findings,
and 2 for invalid usage or missing input/access. `--help` and `-h` show usage;
`--version` reports the toolkit version.
A pass is not a factual score or product runtime proof. The agent also applies
[the checklist](../prompts/PRD_VALIDATION_CHECKLIST.md) and reports unrun checks as
UNVERIFIED. A text-only environment can generate text but cannot prove a build.
