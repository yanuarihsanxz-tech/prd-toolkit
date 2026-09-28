# Reasonix Adapter

This document owns the optional Reasonix integration for the PRD Toolkit. The
adapter exposes the existing toolkit lifecycle as Reasonix custom commands; it
does not fork the PRD contracts, copy the Reasonix runtime into this repository,
or add an npm, MCP, provider, or credential dependency.

## Scope

The toolkit remains the source of truth for PRD structure, stable requirement
IDs, traceability, validation, evidence, plan fingerprints, task state, and
authority. Reasonix is an execution surface that reads those contracts and
operates on a separate target project.

```text
PRD Toolkit contracts -> Reasonix command adapter -> target project artifacts
```

Native versus runner execution is selected by the canonical build layout;
choosing Reasonix as the host does not automatically require runner mode.

The toolkit root `PROGRESS.md` and `DECISIONS.md` never store target-project
state. A target project owns its own `PRD.md`, `PROGRESS.md`, `DECISIONS.md`,
optional `DISCOVERY.md`, optional `TASKS.json` and `.prd/task-state.json`,
`IMPLEMENTATION_AUDIT.md`, application code, and tests.

## Activation

The checked-in command source is under `.reasonix/commands/prd/`. The following
is the historical adapter invocation; live discovery and CLI compatibility with
the installed Reasonix version remain UNVERIFIED. Check its current help before
using these flags, or read the canonical layouts directly in the active host:

```bash
reasonix --dir /absolute/path/to/prd-toolkit --add-dir /absolute/path/to/target-project
```

Invoke a command with the target root as the first argument:

```text
/prd:discover /absolute/path/to/target-project Build a local inventory app
/prd:generate /absolute/path/to/target-project Build a local inventory app
/prd:validate /absolute/path/to/target-project
/prd:improve /absolute/path/to/target-project
/prd:tasks /absolute/path/to/target-project
/prd:execute /absolute/path/to/target-project
/prd:audit /absolute/path/to/target-project
```

Reasonix installation, provider configuration, API credentials, and global
command installation remain optional host setup. Keep credential values outside
tracked files and user-visible evidence. Running these prompts in another agent
remains supported through the canonical layouts.

## Lifecycle Map

| Command | Canonical operation | Writes |
|---|---|---|
| `/prd:discover` | Brainstorm, research material unknowns, and create the PRD handoff | Target `DISCOVERY.md` only |
| `/prd:generate` | Generate and validate a new PRD | Target `PRD.md`, `PROGRESS.md`, and `DECISIONS.md` only |
| `/prd:validate` | Read-only structural and evidence audit | Nothing |
| `/prd:improve` | Audit, improve, and revalidate | Target PRD and required target governance only |
| `/prd:tasks` | Generate and validate the compact v2 plan | Target `TASKS.json` only |
| `/prd:execute` | Build through approved outcome milestones | Declared target-project task scope and task evidence |
| `/prd:audit` | Reconcile every PRD requirement with current implementation evidence | Target `IMPLEMENTATION_AUDIT.md` only |

## Shared Efficiency Contract

Apply these rules to every adapter command:

1. Start with the current target repository, PRD, decisions, and installed
   capabilities. Do not recreate an existing surface.
2. Stop at the first sufficient option: omit the capability if it is not
   required; otherwise reuse the codebase, platform, standard library, or an
   already approved dependency before writing new infrastructure.
3. Implement the smallest complete outcome. Minimal does not mean partial:
   acceptance criteria, input validation, failure behavior, authorization,
   secrets, migrations, destructive operations, and rollback remain explicit
   when applicable.
4. Keep component/file steps inside one outcome milestone when they share an
   authority envelope, rollback unit, and verification boundary. Do not create
   microtasks for narration or bookkeeping.
5. Use targeted checks during implementation and reserve the full applicable
   regression plus real behavioral/manual testing for the final integrated
   audit.
6. Compress internal handoffs and repeated status text, not user-facing PRD
   meaning, acceptance criteria, evidence, safety constraints, or failure data.
7. Do not require Ponytail, Caveman, Honey, Spec Kit, SpecD, or another workflow
   runtime. Their useful minimality and handoff ideas are represented here as
   local rules; external tools remain conditional research options.
8. Keep external optimizers phase-specific. RTK is an optional implementation
   benchmark for noisy command output; Headroom remains experimental. Neither
   is required, installed, or allowed to replace complete failure evidence.

## Authority And Pause Contract

Use Reasonix Ask or Plan posture for discovery, generation, validation,
improvement, planning, and conformance audit.
Native execution follows the user's explicit scoped build authorization without
a second routine approval. Runner mode retains one exact-fingerprint owner
approval for all declared ordinary local non-production work. Continue covered
milestones automatically in either mode.

Pause only when the next step requires one of the following:

- irreversible, destructive, external, sensitive, deployment, production, or
  final-acceptance authority;
- a material scope or approved-behavior change;
- information only the owner can provide;
- unresolved failure, state conflict, `PLAN_CHANGED`, or exhausted attempts;
- a credential or external service required for the active outcome.

Missing optional credentials, benchmarks, provider access, or release inputs do
not block safe local work. Mark only the dependent behavior `UNVERIFIED`.

## Summary Contract

For each completed operation or milestone, return:

```text
Status:
Outcome:
Changed surfaces:
What works now:
Exact way to try it:
Verification:
Resolved findings:
Limitations / UNVERIFIED:
Progress:
Next action:
Required from owner:
```

Keep empty or non-applicable fields explicit rather than inventing evidence.
Structural validation, implementation, runtime behavior, deployment, production
activation, and owner acceptance are distinct readiness levels.

## Evidence Boundary

The command files and toolkit regression tests can prove adapter structure,
routing, arguments, local safety contracts, and version consistency. They do
not prove that a Reasonix binary is installed, a provider is configured, a live
model follows the command, or a target product works. Those behaviors require a
separate manual session and target-project evidence.
