---
layout: execute-tasks
version: "4.0.0"
mode: build-from-prd
toolkit_root: ".."
default_prd: "@project/PRD.md"
default_execution: native
---

# Build from the PRD

The user can say: `Build this PRD until done.` Attach the target PRD and work in
its project folder. An attachment with no build instruction is reference data.

## Entry And Mode

1. Read the complete PRD, target repository instructions, and existing progress
   once. Inspect current code, commands, and relevant dependencies. Preserve
   unrelated user work. Do not regenerate the PRD or reopen settled decisions.
2. Inspect the actual skill/tool catalog. Read matching instructions, verify
   prerequisites, and record the selected route or fallback with affected IDs
   in the existing plan/progress and final audit. No silent skill installation.
3. **Native (default):** when no toolkit `TASKS.json` or `.prd/task-state.json`
   exists and no runner is requested, use the host's normal plan plus the target
   `PROGRESS.md`. Do not create runner artifacts or invent runner receipts.
4. **Runner:** if explicitly requested, or a toolkit plan/state exists, read
   [the runner guide](../prompts/PHASE_GATED_TASK_RUNNER.md) completely and use
   its v2 plan/state, exact approval, and failure semantics. Inspect ambiguous
   or malformed plan/state files instead of discarding them or falling back.
   Missing runner access is a blocker for runner-managed execution, not authority
   to bypass it. Native execution needs no toolkit runtime once the PRD is complete.

## Native Execution

Build a compact 2-3 milestone plan from the PRD, including the final integrated
audit. Four needs independent outcomes and five is exceptional. Group UI,
backend, data, tests, and docs by user outcome; file steps remain an internal
checklist. Record the PRD version, requirement/AC coverage, chosen routes,
references to PRD milestone outcomes/required checks and current state in
`PROGRESS.md`. Do not copy static requirements or Done When into a second plan.

The user's explicit build request authorizes scoped local implementation. Show
the plan and continue; do not ask them to approve the same work again. A request
to plan or review only does not authorize building. A PRD is a specification,
not proof of external authority. Pause for a material product/scope decision or
an uncovered external write, destructive action, purchase, credential change,
deployment, production operation, or final owner acceptance.

Declared project-local dependency setup is part of the authorized build when
the host permits it. Installing global skills/runtimes or setting up paid accounts
is a separate action; do not confuse these with ordinary local project setup.

Implement until the requested product is directly usable. Make its core path
runnable early, then complete connected behavior. Set PRD status to
`implementation` when building begins; advance `current_milestone` only with
current evidence. Preserve IDs; record justified product decisions in the target
`DECISIONS.md`. Do not turn routine implementation choices into approval gates.

Use focused checks during implementation. Diagnose failures before retrying;
never repeat unchanged failed actions hoping for success. Continue independent
safe work if an external prerequisite is missing, while marking affected IDs
UNVERIFIED. Do not complete a dependent milestone or claim the product complete
while required behavior/checks are missing. Stubs cannot stand in for final
integration evidence. On resume, inspect current source/progress; retain valid
evidence and repeat only checks invalidated by changes.

Keep a concise resume delta in PROGRESS.md: active milestone, changed paths,
checks/results, unresolved IDs, and next exact action. Reuse the initial project
map and inspect affected contracts/dependencies on continuation; do not scan the
whole repository or rediscover tools per file. Reopen broader context only after
material source, requirement, environment, or route changes. Preserve diagnostic
failures; summarize successful repetitive output instead of flooding context.

## Completion In Either Mode

Run full applicable regression and exercise the intended user/operator path,
including material failure and boundary cases. Follow
[the audit layout](AUDIT_IMPLEMENTATION.md) for the report. In this build mode,
repair in-scope defects and rerun affected checks before finalizing it.

Write `IMPLEMENTATION_AUDIT.md` with every FR/NFR/AC, its implementation surface,
current evidence and status, source-state identity, real-versus-mocked coverage,
route/fallback limitations, and one exact next action. Local completion requires
all implementation-scoped requirements and required checks to pass. Deployment
and owner acceptance remain separate claims; do not mark required behavior N/A
without an explicit scope decision. Stop only at completion or a concrete blocker.

At each milestone, report the usable outcome, grouped changes, one exact way
to try it, verification, limitations, and progress; continue automatically when
covered. Final delivery links the runnable product and audit with exact start/test
instructions, evidence, and any remaining blocked scope.
