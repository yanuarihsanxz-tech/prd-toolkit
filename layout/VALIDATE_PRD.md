---
layout: validate-prd
version: "2.0.0"
mode: validate-only
toolkit_root: ".."
application_code_changes: forbidden
prd_changes: forbidden
---

# Validate a PRD Without Editing

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Copy this prompt when you want an audit report only.

```text
Use the PRD toolkit at <toolkit-root>.

mode: validate_only
project_root: @project
prd_file: @project/PRD.md

instructions:
  - Inspect the current PRD and relevant project evidence.
  - Read AGENTS.md and applicable repository instructions.
  - Run `node <toolkit-root>/scripts/validate-prd.mjs @project/PRD.md --json` as the deterministic structural preflight when Node.js and the file are available.
  - Use prompts/PRD_VALIDATION_CHECKLIST.md.
  - Validate metadata against schemas/prd-frontmatter.schema.json, including current_milestone <= total_milestones.
  - Verify unique FR-###, NFR-###, and AC-### IDs and complete traceability in both directions.
  - For rework or bugs, review docs/CHANGE_CONTRACT.md: current evidence, preserved behavior/data/interfaces, affected IDs and delta table, retirement history, verification and original reproducer. If a baseline is available, run compare-prd.mjs with --json --fail-on-removal; review findings without editing either input.
  - Apply docs/AUTHORITY_POLICY.md compatibility rules. A policy format match never proves session, host or runner authority.
  - Use the checklist's applicability rules and denominator formula exactly.
  - Report group subtotals, excluded N/A checks, the score, verdict, blockers, contradictions, and missing evidence.
  - Report the structural preflight separately; never convert its pass into a checklist score or readiness claim.
  - Separate requirement, implementation, test, mock, and environment failures.
  - Mark unsupported claims UNVERIFIED.
  - Do not edit the PRD.
  - Do not modify application code or task state.
```
