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
  - Read docs/CHANGE_CONTRACT.md. Before editing, retain the original PRD in an existing immutable revision or a local temporary snapshot; record its source identity. This snapshot is comparison evidence, not another active specification.
  - For existing-product changes or bugs, embed the change contract in Overview or Requirements. Include current evidence limits, requested change, preserved behavior/interfaces/data, affected FR/NFR/AC IDs, the ID | Status | Note delta table, changed/preserved verification and the original bug reproducer.
  - Keep IDs for continuing behavior. Never renumber to close gaps, reuse retired IDs, or drop retirement history. Migrate legacy ID formats only through a documented explicit mapping that preserves meaning.
  - After editing, run `node <toolkit-root>/scripts/compare-prd.mjs <baseline-prd> @project/PRD.md --json --fail-on-removal`. Exit 1 requires review of each removal and retirement record; it is not permission to remove behavior. Exit 2 means no trustworthy comparison. Review reactivated IDs, lost retirement history, changed AC evidence and the non-semantic limits.
  - Validate unique FR-### and NFR-### requirement IDs and AC-### acceptance IDs without changing continuing IDs or approved behavior.
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
