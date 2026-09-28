# Toolkit Maintenance Status

This file tracks the toolkit only. Generated target projects keep their own
PROGRESS.md using templates/project-progress.md.

| Field | Value |
|---|---|
| Local version | 3.1.2 |
| Current work | Proportional specifications, capability selection and evidence quality |
| Status | Verified locally: 44 tests, 12 generator cases, Full/Lite previews and clean export checks pass |
| Prior verification | 3.0.3: 40 tests and 12 representative generator cases passed on macOS arm64 / Node 26.8.1 |
| Hosted CI | 9/9 jobs passed on Linux, macOS and Windows with Node 20, 22 and 24: https://github.com/yanuarihsanxz-tech/prd-toolkit/actions/runs/36367364046 |
| Public repository | https://github.com/yanuarihsanxz-tech/prd-toolkit; 70 canonical files verified on GitHub on 2026-09-28 |

Current source and actual command results take precedence over historical status.
See evals/git-readiness-2026-09-27.md for bounded audit evidence.

## 3.1.2 Verification Scope

The existing full check passed: 44 tests, 12 checked-in generator regression
cases and zero toolkit findings. Routing and audit guidance now distinguish
outcome assertions, skips, diagnostics and benchmark measurement. Full/Lite
schemas and CLI behavior remain unchanged. These are instruction improvements;
no fresh independent generation trial or measured token saving is claimed.
The public repository and hosted CI were verified separately from local checks.

## 3.1.0 Verification Scope

The preview command was exercised against both complete example PRDs, invalid
input, missing files, missing/hidden product flows and paths containing spaces.
The worked owner handoff reuses the Full PRD diagram exactly and cites existing
requirement IDs. The export test runs both preview commands from another cwd.
These checks prove extraction and CLI behavior, not that every model follows
prompt instructions. No new independent model-generation trial or Mermaid
renderer execution was performed; hosted CI had not run at that stage.

## Upstream Comparison — 2026-09-27

- [Spec Kit contribution guide](https://github.com/github/spec-kit/blob/main/CONTRIBUTING.md): adopt focused changes, reproducible checks and updated user documentation.
- [OpenSpec onboarding](https://github.com/Fission-AI/OpenSpec/blob/main/docs/README.md): make the distinction between terminal commands and agent instructions explicit.
- [GSD contribution guide](https://github.com/gsd-build/get-shit-done/blob/main/CONTRIBUTING.md): adopt bug/improvement categories and concrete acceptance evidence; do not add its mandatory approval process to small fixes.
- [GitHub Mermaid support](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams): use Markdown Mermaid blocks without adding a diagram service.

These are design references, not benchmarks showing this toolkit outperforms
those projects. No upstream implementation was imported.

Patch 3.1.1: default entry and onboarding now make validation, summary and
flowchart automatic, scope work to specification, and honor analysis-only intent.
Prompt routing was reviewed against new-product, rework, bug-fix, existing-PRD
and missing-context scenarios; this is source review, not a live host evaluation.
