# PRD Efficiency Rework — 2026-09-12

## Scope And Result

Compatible local toolkit maintenance, baseline 3.0.1. The generator, selected
template, copy-paste entry, checklist, progress template, and continuation
guidance are aligned. No application, credential, global core instruction,
runner implementation, schema, dependency, or external service was changed.

Changes remove repetition rather than required product scope: one definition
per requirement/AC/milestone outcome, references elsewhere, live evidence/resume
deltas in PROGRESS.md, applicable controls rather than generic infrastructure,
and no fixed ten-step reasoning sequence or whole-project rescan per file.
The 10/6 section contract, stable IDs, full traceability, final integrated audit,
native build authority, and existing runner no-bypass rules remain unchanged.

## Reproducible Input-Size Comparison

Measure UTF-8 file sizes with Node `fs.statSync(path).size`. Before snapshots
are preserved at `temporary local evidence directory (not distributed)` for local review;
temporary backups are not a required toolkit dependency or durable release archive.

The generation reading set is root SKILL.md, generator, one selected template,
validation checklist, project-progress template, and project-decisions template.
It excludes chat, automatically injected instructions, tool output, optional
guides, and the alternate template. The unchanged decisions template is 1,158 bytes.

| Reading set/file | Before bytes | After bytes | Reduction |
|---|---:|---:|---:|
| Full generation reading set | 65023 | 49060 | 24.5% |
| Lite generation reading set | 60065 | 44484 | 25.9% |
| Generator alone | 24526 | 10836 | 55.8% |
| Optional generation copy-paste entry | 3884 | 1072 | 72.4% |

Some files intentionally grew: checklist applicability is more explicit and
continuation instructions now specify when broader context must be reopened.
File reduction is a measured input-size result, not a billed-token, latency,
cache-hit, or total-conversation cost measurement. Model tokenization, output
length, reasoning, task difficulty, and caching can change actual usage.

## Verification And Limits

`npm run check` covers toolkit consistency, existing generator cases, and tests.
Two added tests transplant the current embedded builder instructions into both
representative PRDs, retain every original requirement/AC, use one diagram and
one milestone definition table, and check validation. Removing the remaining
diagram still fails. Full/Lite embedded instructions must match. Existing
negative coverage for orphan IDs, missing/invalid routing, metadata, and authority
and all runner failure/approval tests are retained; validators were not weakened.

The first added test found that abbreviated authority wording did not satisfy
the existing validator. The templates were corrected; the validator was unchanged.
Final test totals are recorded in root PROGRESS.md.

These are deterministic structural/contract tests, not a new live model-generated
PRD or end-to-end product build trial. The older forward-test report remains
historical evidence for its tested source state, not proof for this revision.
Actual token savings and cross-model generation/build behavior remain UNVERIFIED.

## Usage

The normal route is unchanged: brainstorm/research, generate the PRD with this
folder, then give that PRD to a fresh builder with an explicit build request.
No new tool, key, setup command, checklist artifact, or routine approval is needed.
Existing target PRDs and runner plans are not automatically rewritten or migrated.
