# Toolkit Maintenance Status

This file tracks the toolkit only. Generated target projects keep their own
PROGRESS.md using templates/project-progress.md.

| Field | Value |
|---|---|
| Local version | 3.2.0 |
| Current work | Public 3.2.0 update: change contracts, authority format, portable distribution and synchronized onboarding |
| Status | Publication candidate passes 113 tests (no skips), all 12 structural regression cases and zero toolkit findings on 2026-10-03 |
| Publication | 3.2.0 source published to public main on 2026-10-03; exact source commit and hosted CI verified below |
| Prior verification | 3.0.3: 40 tests and 12 representative generator cases passed on macOS arm64 / Node 26.8.1 |
| Prior hosted CI | 9/9 jobs passed on Linux, macOS and Windows with Node 20, 22 and 24: https://github.com/yanuarihsanxz-tech/prd-toolkit/actions/runs/36367364046 |
| Prior public inventory | https://github.com/yanuarihsanxz-tech/prd-toolkit; 70 canonical files verified on GitHub on 2026-09-28 |

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

## 3.2.0 Delivery Plan — 2026-10-02

The original request included GitHub publication. The owner's later instruction
on 2026-10-02 changes delivery to the live local toolkit folder; the owner will
publish it separately. This maintenance uses native execution, with no runner
state present. Hosted CI, tags and releases are outside the revised task.

| # | Outcome | Done when | Status |
|---|---|---|---|
| 1 | Comparable specifications with explicit authority format | Verified v3 comparison is integrated; fixed policy v1, legacy behavior, malformed inputs and CLI contracts pass focused tests. | Verified |
| 2 | Coherent generation and change handoff | Entry, templates, generation, review, improvement, audit, examples and first-use installation explain the same portable contracts. | Verified |
| 3 | Verified local delivery | Updated live source passes the full suite; the portable archive is extracted and checked independently; evidence and limitations are recorded. | Local source verified; archive result is in the delivery receipt |

Source reconciliation: the 70-file live export and supplied snapshot match the
latest upstream source at `3e827d926cb0e0c71c598c29af90003cab90a1ed`.
Implementation was saved as local commit `4b21992c82625cca7f914ca1e50c2d069fd2d0c7`.
When the temporary worktree was no longer present, that commit restored all 79
canonical files into the live toolkit after checking the original 70 files for
independent edits. The original files are retained in a recovery ZIP under
local runs; the separate checkout and unrelated parent repository are preserved.
The original 56 comparison tests remain byte-identical to the verified patch.

The [3.2.0 verification report](evals/release-3.2.0.md) separates fresh local
checks from earlier model trials. Earlier generation and runtime test results
remain observed evidence in the conversation, but their temporary raw artifacts
are unavailable and the builder's final audit did not complete. No complete
model-performance or production-readiness claim is made.

## Public 3.2.0 Update — 2026-10-03

The owner authorized publishing the latest live toolkit to the existing public
repository and synchronizing its description. The verified local ZIP matches
all 79 canonical live files. Work starts from upstream main at
`3e827d926cb0e0c71c598c29af90003cab90a1ed` in an isolated checkout. Existing
uncommitted publication-checkout edits are retained for recovery and incorporated
where applicable; source publication does not require rewriting repository history.

README restores both clone/ZIP onboarding and the short repository-link invocation.
Local-only delivery wording is historical; current publication evidence belongs
here. Hosted results, the exact source commit and synchronization are recorded
after the corresponding actions succeed. No version tag or GitHub release asset
is implied by the source push.

Fresh publication-candidate checks: `npm run check` passed 113/113 tests with
zero skips, all 12 structural regression cases and no toolkit findings on macOS
arm64 / Node 26.8.1. `git diff --check` passed. The original local ZIP verified
against its manifest before publication-documentation edits.

Public source commit: `19445796ca0e2981081cf898adab8c8b872d0007`. GitHub
Actions [run 37081441088](https://github.com/yanuarihsanxz-tech/prd-toolkit/actions/runs/37081441088)
passed all nine jobs: Linux, macOS and Windows with Node 20, 22 and 24. The
public tree contains the expected 79 canonical files. Repository visibility is
public, and its description now names the foreman, specialist routing, revision
comparison and verifiable builder handoff. These checks establish publication
and toolkit behavior; they do not establish universal model or target-app quality.

## 3.3.0 portable workflow — 2026-11-03

Native maintenance starts from 250d727 on an isolated feature branch. The current
request authorizes research and implementation with real-case verification.
Existing main and historical attempts remain intact; no managed runner is active.

| # | Outcome | Evidence boundary | Status |
|---|---|---|---|
| 1 | Portable operation selection over existing contracts | CLI aliases, exact-source packets, no-overwrite and foreign-directory checks | Implemented; focused checks passed |
| 2 | Reproducible behavioral evaluation | Fixed cases on real processes/files; CSV baseline fails and repair passes; generated PRDs and sources retained | Implemented; focused checks passed |
| 3 | Integrated, reviewable delivery | Full suite, clean export and source review; hosted results belong to the exact PR commit | Verified locally; hosted evidence is reported on the PR |

The [research](evals/research-2026-11-03.md), [usage contract](docs/PORTABLE_WORKFLOW.md)
and [case audit](evals/real-cases/README.md) separate observations from limits.
Focused checks found that comparing decoded strings could hide invalid-byte
rewrites; the evaluator now compares bytes and rejects undeclared paths. Source
mutation also prevents a passing receipt. No cross-model, browser-product,
token-cost, provider, deployment or owner-acceptance claim is made.

Local integrated evidence: all 131 tests passed with zero skips and all 12
structural generator regressions passed on macOS arm64 / Node 26.8.1. The
unchanged 3.2.0 checkout separately passed 113 tests. A 97-file clean export
verified against its manifest and passed the same 131 tests from its own
directory, including packet creation and real-case execution with spaced paths.
`git diff --check` passed. The first integrated attempt exposed a hard-coded
3.2.0 version assertion; it now compares with package.json. Raw failed/successful
local attempts are retained under ignored runs; no attempt was overwritten.

Saving exports under runs reproduced an old test-discovery problem: unscoped
node --test also executed the exported suite and reported 260 tests. The npm
scripts now enumerate only the toolkit test files; a regression verifies that
exported copies are ignored. A packet saved at the toolkit root also triggers
documentation checks on its embedded relative links, so quickstart examples now
save packets beside the checkout and verify the export remains unchanged.

An independent replay used clean archives of the published 3.2.0 source
(250d727) and the 3.3.0 implementation (c3d78b7). A failing test saved under
the same export path in both ran only on 3.2.0. The [real-case report](evals/real-cases/README.md)
records the observed results and how to repeat them. The normal generator
now uses this example to explain independently checkable acceptance criteria.

The final branch/commit and hosted CI links are delivery evidence, not source
claims baked into these self-referential files. Merge, release, deployment and
final acceptance are not performed by this maintenance.
