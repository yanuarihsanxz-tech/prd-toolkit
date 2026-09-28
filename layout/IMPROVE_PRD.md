---
layout: improve-prd
version: "2.0.0"
mode: validate-and-improve
toolkit_root: ".."
default_prd: "@project/PRD.md"
application_code_changes: forbidden
---

# Validate and Improve a PRD

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Copy this prompt when Codex may update the PRD after auditing it.

```text
Use the PRD toolkit at <toolkit-root>.

mode: validate_and_improve
project_root: @project
prd_file: @project/PRD.md

instructions:
  - Inspect the current PRD and relevant project evidence.
  - Read AGENTS.md and applicable repository instructions.
  - Run `node <toolkit-root>/scripts/validate-prd.mjs @project/PRD.md --json` before editing and preserve its finding codes as pre-edit evidence.
  - Validate with prompts/PRD_VALIDATION_CHECKLIST.md before editing.
  - Validate metadata against schemas/prd-frontmatter.schema.json.
  - Apply prompts/RELIABILITY_GUIDE.md only where relevant.
  - Preserve approved requirements, decisions, compatibility, and safety rules.
  - Normalize requirements to unique FR-### and NFR-### IDs and acceptance criteria to unique AC-### IDs without silently changing approved behavior.
  - Rewrite ambiguous event, state, fault, and timing criteria into selective EARS-style `WHEN/WHILE/IF/WHERE ... THE SYSTEM SHALL ...` wording when it improves observability; do not churn already testable criteria.
  - Fix confirmed ambiguity, two-way traceability, contract, and verification gaps.
  - Reject additions that increase complexity without measurable value.
  - Mark unsupported claims UNVERIFIED.
  - Update only @project/PRD.md and, when governance changes are required, @project/PROGRESS.md or @project/DECISIONS.md.
  - Never write target-project state into the toolkit-root PROGRESS.md or DECISIONS.md.
  - Do not modify application code or task state.
  - Re-run the structural validator after editing, then reapply the checklist; report each evidence layer separately.
  - If product behavior changed, update its saved flowchart and summarize the changed flow using the generator's Owner Summary And Product Flow contract.
```
