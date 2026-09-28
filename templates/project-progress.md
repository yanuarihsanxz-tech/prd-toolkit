---
document_type: project-progress
project: "[Project Name]"
prd: "PRD.md"
status: draft
current_milestone: 0
total_milestones: 1
last_updated: "YYYY-MM-DD HH:mm"
---

# [Project Name] Progress

Live state for this target only. The PRD owns milestone outcomes, Done When,
and FR/NFR/AC coverage; reference them rather than copying the specification.
Generation leaves implementation unstarted. Do not use toolkit-root logs.

## Current State

- PRD version: [version]
- Execution mode: native by default; retain existing/requested runner mode.
- Build authority: [actual user build request or Not started - generation only]
- Active milestone / next action: [milestone ID and exact action or Not started]
- Required unresolved input: [specific blocker and affected IDs or None]

## Milestones And Evidence

| # | PRD milestone reference | Status | Current evidence / remaining gap |
|---|---|---|---|
| 1 | [PRD heading and milestone number] | ⬜ Not Started | [No execution evidence yet] |

Statuses: ⬜ Not Started, 🔄 In Progress, ✅ Verified, ✅ Approved. Verified means
required checks passed; Approved requires an actual owner verdict. Synchronize
frontmatter and PRD milestone/status metadata, not duplicate outcome descriptions.
Runner plan/state remains authoritative in runner mode; never replace it here.

## Resume And Changes

Record useful deltas: changed paths, source-bound checks/results, chosen routes
and UNAVAILABLE fallbacks with affected IDs, decisions, and next exact action.
Preserve relevant failures and valid evidence; source changes invalidate affected
proof. On resume read this summary and relevant changed contracts/files, not the
whole project repeatedly. Reconcile source/runner state before continuing.
Follow the PRD's embedded builder contract; no new approval gate is created by
this file or an ordinary milestone transition.
