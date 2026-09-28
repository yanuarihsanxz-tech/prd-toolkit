# Milestone Delivery Runner

This file owns the optional stateful runner mode and keeps its historical path
for compatibility. Use it when explicitly requested or an existing toolkit
plan/state requires it. New native builds follow `layout/EXECUTE_TASKS.md` and
do not load this guide. In runner mode, `TASKS.json` stores a compact
ordered implementation plan; `.prd/task-state.json` stores local evidence.

## Desired Flow

```text
research + brainstorming
        ↓
complete implementation-ready PRD
        ↓
optional focused PRD revision
        ↓
one compact milestone plan + one owner approval
        ↓
autonomous local implementation through all approved milestones
        ↓
runnable/visible product + real integrated manual audit
        ↓
optional production/release approval
```

The runner exists to preserve order, scope, evidence, and recovery. It must not
turn implementation into file-level transactions or require the owner to approve
ordinary transitions between frontend, backend, data, tests, documentation, or
local qualification.

## Planning Profiles

Choose the smallest profile that covers the product:

| Profile | Total runner tasks, including final audit | Typical shape |
|---|---:|---|
| Rapid | 2 | Complete runnable implementation; integrated manual audit |
| Standard | 3 | First usable/visible product; remaining connected system; integrated manual audit |
| Complex | 4 | Three independently meaningful outcomes; integrated manual audit |
| Exceptional | 5 maximum | Only when distinct authority, deployment, migration, rollback, or runtime boundaries require separation |

Five is a hard ceiling for a new plan, not a target. A normal application should
usually have two or three total tasks. File edits, components, endpoints, models,
tables, acceptance criteria, code layers, and test types are internal checklist
items—not runner tasks.

For UI products, prefer an early runnable interface or vertical workflow so the
owner can see and try the product. Frontend-first is allowed when it produces a
meaningful testable outcome. Backend-first is allowed when it is a real technical
dependency. Do not force either ordering mechanically.

## Approval Budget

Approval is based on authority, not milestone count.

1. **Default and usually only approval:** approve the complete immutable local
   plan fingerprint. This authorizes every declared non-production task,
   milestone transition, targeted check, in-scope defect fix, and final local
   integrated audit in that plan.
2. **Optional high-risk approval:** required only immediately before a task that
   introduces undeclared external writes, sensitive-data access, destructive
   work, a material migration, staging mutation, financial action, or another
   side effect explicitly marked `requires_owner_authorization: true`.
3. **Optional production/final acceptance approval:** required immediately before
   deployment, production activation, publication, purchase, or an irreversible
   final owner verdict.

Ordinary work therefore uses one approval. Truly complex or high-risk work may
use two, and three is the maximum normal approval budget. Never create approval
checkpoints merely because `phase`, `layer`, page, milestone, or task changed.

## Core Rules

1. Read the complete PRD and task plan once at session start, resume, or context
   compaction. Build a bounded index of requirement IDs, architecture surfaces,
   paths, shared contracts, and verification commands. Re-read only relevant
   portions during later milestones unless evidence conflicts or source changes.
2. Work on one active milestone task at a time and follow plan order. After a
   task completes, automatically start the next approved non-production task.
3. A task represents a user/operator-verifiable outcome and may cross UI,
   backend, data, integrations, tests, and documentation.
4. Keep implementation steps inside the active task. Do not create runner state
   transactions for each file, component, endpoint, test, or requirement ID.
5. Preserve unrelated user changes. Never reset or silently absorb them.
6. Never store secrets in the plan, state, logs, fixtures, evidence, or reports.
7. Keep configured, implemented, built, running, behaviorally exercised,
   production-ready, and owner-accepted as distinct evidence states.
8. Run targeted checks while implementing. Do not rerun the whole repository or
   rescan the whole project for every internal step.
9. The final task runs the full applicable regression and real behavioral/manual
   product test. Fix in-scope defects found there and rerun affected evidence.
10. Missing optional benchmark media, credentials, provider access, or release
    inputs must not prevent producing the local implementation and runnable shell
    when those can be built safely. Mark only the dependent behavior `UNVERIFIED`
    and continue useful work. Stop only when the input blocks the active outcome.
11. A genuine failed task blocks later tasks until repaired or the plan changes.
    Do not call incomplete work complete.
12. A `PLAN_CHANGED` mismatch invalidates the old approval. Preserve old state
    and require one new approval for the materially changed plan.
13. Production, destructive, financial, purchase, credential mutation, and
    externally visible actions are never inferred from local-plan approval.

## Local Components

```yaml
runtime: Node.js
runner_network_required: false
task_plan: TASKS.json
task_state: .prd/task-state.json
task_schema: /absolute/path/to/prd-toolkit/schemas/task-plan.schema.json
state_schema: /absolute/path/to/prd-toolkit/schemas/task-state.schema.json
runner: /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs
plan_schema_version: 2
state_schema_version: 2
```

The runner CLI is offline and dependency-free. A task may use network or provider
access only when its authority contract permits it.

## Plan Contract

Every plan contains:

- a unique plan ID, PRD path/version, timestamp, and exact secret-free source
  fingerprint;
- two to three total tasks by default, four when justified, and never more than
  five in a new plan including the final integrated audit;
- ordered outcome-oriented tasks with stable refs;
- mapped `FR-###`, `NFR-###`, and `AC-###` IDs;
- earlier-task dependencies;
- allowed and forbidden paths;
- focused `VER-###` contracts with environment, expected result, evidence,
  timeout, and cleanup;
- a precise authority envelope and bounded attempt count.

`phase` and `layer` are progress metadata only. They never create an approval
checkpoint by themselves.

## One Approval and Continuous Execution

Run from the target project root:

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  next --plan TASKS.json --state .prd/task-state.json --json
```

If plan approval is required, show one compact plan summary containing the
product outcome, total milestone tasks, what becomes runnable after each task,
real authority boundaries, final manual audit, and exact fingerprints.

After explicit approval, record it once:

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  approve-plan \
  --actor "Owner" \
  --evidence "Owner approved the displayed complete local implementation plan." \
  --plan TASKS.json --state .prd/task-state.json --json
```

That approval covers every ordinary local non-production milestone transition.
No `continue`, phase approval, or per-task owner message is required.

`AUTORUN` remains a compatibility shortcut. When the owner sends it for a current
PRD/plan, the agent may record missing plan approval and bounded non-production
authorization internally, then execute through the final local audit. The owner
must never be asked to copy a hash, task ref, path, or CLI command.

## Milestone Execution Loop

For each returned candidate:

1. Inspect only relevant current code and shared contracts.
2. Confirm authority, paths, side effects, resource budget, and cleanup owner.
3. Start with current source evidence:

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  start <ref> \
  --source-state "git:<commit-or-secret-free-manifest>" \
  --evidence "Preflight passed; scope, existing changes, side effects, and cleanup checked." \
  --plan TASKS.json --state .prd/task-state.json --json
```

4. Implement the complete milestone outcome. Cross-layer changes are expected
   when required by the outcome.
5. Run targeted checks and one bounded behavioral smoke. Make the product
   runnable or visibly testable as early as the plan allows.
6. Fix in-scope errors rather than converting them into another microtask.
7. Complete only after every declared check passes:

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  complete <ref> \
  --source-state "git:<verified-source-or-secret-free-manifest>" \
  --checks "VER-001,VER-002" \
  --evidence "Declared verification passed against current source; cleanup completed." \
  --plan TASKS.json --state .prd/task-state.json --json
```

8. Emit the milestone summary below, then immediately continue to `next` when
   the next task is covered by the plan approval.

## Milestone Summary Contract

Every completed milestone summary is complete but compact:

```text
Milestone: <ref — title>
Outcome delivered: <user/operator-visible result>
Changed: <grouped files/surfaces, not exhaustive narration>
What works now: <specific runnable behavior>
How to try it now: <one exact command/path/action, or N/A with reason>
Verification: <checks, environment, result>
Known limitations: <only material unverified/blocked items>
Plan progress: <completed>/<total>
Next: <next milestone and whether it continues automatically>
```

Do not end with a wall of disclaimers or an ambiguous question. If the next task
can start, say it continues automatically. If stopping, name the exact authority
or material input required.

## Failures and Real Trial-and-Error

Use `fail` only for a blocker that prevents the active milestone outcome after
safe task-scoped diagnosis:

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  fail <ref> "Specific unresolved blocker" \
  --classification "ENVIRONMENT_BLOCKED" \
  --source-state "git:<failed-source-or-secret-free-manifest>" \
  --evidence "Sanitized reproduction and diagnostics." \
  --plan TASKS.json --state .prd/task-state.json --json
```

If the cause is repaired inside already approved local authority, the builder may
record a bounded retry as actor `Builder` and continue the same task. Owner
approval is required for retry only when it needs new authority, a changed plan,
external owner input, production/destructive action, or an exhausted attempt
budget. Prior attempts remain preserved.

```bash
node /absolute/path/to/prd-toolkit/scripts/local-task-runner.mjs \
  retry <ref> \
  --actor "Builder" \
  --source-state "git:<resolved-source-or-secret-free-manifest>" \
  --evidence "The blocker was reproduced, repaired within approved scope, and is ready for bounded retry." \
  --plan TASKS.json --state .prd/task-state.json --json
```

Real trial-and-error belongs inside implementation and the final integrated
manual audit. Preserve evidence, bound attempts, and fix actual behavior. Do not
replace real testing with dozens of planning transactions.

## Stop Conditions

Stop only when:

1. every task is complete;
2. the plan fingerprint materially changed;
3. a failed task cannot be repaired inside existing authority;
4. a required owner input is unavailable and blocks the active outcome;
5. the next action requires external, destructive, sensitive, staging,
   production, purchase, or other authority not already granted;
6. a state lock or source conflict prevents safe mutation.

Do not stop merely because a milestone, phase, layer, page, or task changed.

## Historical Compatibility

Schema-v1 plans/states remain historical and are never silently rewritten.
Existing approved schema-v2 plans remain readable even when they used older
microtask granularity or phase checkpoints. New plans follow this compact
milestone and approval-budget policy.
