# Reproducible behavioral trials

These are runnable, sanitized examples with real files and processes. They are
not customer deployments, independent model comparisons, or evidence that every
PRD produces a working product. The same coding session prepared the PRDs and
implementations; this is a formative workflow trial, not a blind handoff.

## Recorded result — 2026-11-03

A saved export surfaced a defect in this repository's own `npm test` command.
To reproduce it, we extracted the published 3.2.0 source and the 3.3.0
implementation into separate directories. Each got the same file,
`runs/saved-export/tests/saved-export-only.test.mjs`, containing one line:

```js
throw new Error("SAVED_EXPORT_TEST_EXECUTED");
```

| Source | What `npm test` did | Exit |
|---|---|---|
| [3.2.0](https://github.com/yanuarihsanxz-tech/prd-toolkit/tree/250d72717b76029c8423913e2662950058c67af0) | All 113 project tests passed. Test discovery also executed the failing file in the export. | 1 |
| [3.3.0 implementation](https://github.com/yanuarihsanxz-tech/prd-toolkit/tree/c3d78b760f95e091c24ecfd03c6a083793e1bf1f) | All 131 project tests passed. The file in the export was never executed. | 0 |

To repeat in disposable checkouts, add that file to each revision and run
`npm test` from each root. Check both the exit code and whether the error marker
appears in the output. This keeps the acceptance criterion useful as tests are
added. The [distribution regression](../../tests/distribution.test.mjs) also
checks which files the launcher selects.

On macOS arm64 with Node.js 26.8.1:

| Scenario | Preserved artifacts | Observed outcome |
|---|---|---|
| New text-inspection CLI | [brief](line-summary/BRIEF.md), [PRD](line-summary/PRD.md), [fixed cases](line-summary/case.json), [implementation](line-summary/candidate.mjs) | 12/12 process cases passed, including blanks, LF/CRLF, Unicode, literal filters and errors |
| Existing CSV export repair | [brief](csv-total/BRIEF.md), [PRD](csv-total/PRD.md), [fixed cases](csv-total/case.json), [broken baseline](csv-total/before.mjs), [repair](csv-total/candidate.mjs) | Same 14 cases: baseline 5 passed / 9 failed; repair 14 passed / 0 failed |
| Additional boundary verification | [native tests](../../tests/real-cases.test.mjs) | Both commands reject invalid UTF-8 and directories; 14 additional CSV parser/decimal boundaries pass |

Both saved PRDs passed structural validation with zero findings. They remain
**draft specification snapshots** so another builder can repeat the trial from
the original input. The completed reference implementations and results live
here, separately from the snapshots' unstarted milestone state. No owner
acceptance or deployed service is implied.

The CSV baseline fails quoted comma/newline parsing, large exact amounts,
excess precision, NaN, formula input, unclosed quoting, wrong headers and extra
fields. The repaired source uses a small CSV state machine and integer cents.
The fixed oracle existed before the repair and was unchanged afterward. The
5-to-14 result measures that program repair, **not a 3.2-to-3.3 model improvement**.

## Reproduce

Run from the toolkit checkout; no package installation or credentials:

```bash
node --test tests/real-cases.test.mjs
node scripts/prd.mjs validate evals/real-cases/line-summary/PRD.md --json
node scripts/prd.mjs validate evals/real-cases/csv-total/PRD.md --json
```

For independent CLI receipts, replace the absolute checkout path:

```bash
node scripts/prd.mjs evaluate evals/real-cases/csv-total/case.json --json -- node /absolute/path/to/prd-toolkit/evals/real-cases/csv-total/before.mjs
node scripts/prd.mjs evaluate evals/real-cases/csv-total/case.json --json -- node /absolute/path/to/prd-toolkit/evals/real-cases/csv-total/candidate.mjs
node scripts/prd.mjs evaluate evals/real-cases/line-summary/case.json --json -- node /absolute/path/to/prd-toolkit/evals/real-cases/line-summary/candidate.mjs
```

The first command intentionally exits 1: the evaluator must detect that defect.
The next two exit 0. Each fresh report gives the case hash, entry-file hashes,
environment and per-case failures/duration. Save it in your own run directory;
raw reports can contain local command paths, so do not publish them unreviewed.

To try another assistant, give it the brief and a `context generate --type tool`
packet, validate its generated PRD, then explicitly authorize a build in a separate
directory. Keep these case files unchanged and point the evaluator at that build.
Do not give a measured builder the reference source as if it were a blind trial.
An independent blinded trial was not performed for this version.

## Requirement-to-evidence audit

All IDs in these two specifications are covered below; no sampling:

| PRD IDs | Implementation and evidence | Bounded status |
|---|---|---|
| Line Summary FR-001, AC-001 | candidate.mjs normalization/counting; notes-with-blanks, empty-file, one-empty-line, windows-newlines | Verified for stated cases |
| Line Summary FR-002, AC-002 | literal includes/filter; Unicode, case-sensitive, shell/regex literal and empty-filter cases | Verified for stated cases |
| Line Summary FR-003, AC-003 | argument, stat, fatal UTF-8 decode and output paths; fixed errors and native UTF-8/directory tests | Verified locally |
| Line Summary NFR-001, AC-004 | fixed fixture bytes and unexpected paths checked; source imports only fs and makes no network call | Verified within source/case scope; network isolation was not instrumented |
| CSV Total FR-001, AC-001 | ordinary-export passes for both retained versions with unchanged invocation/JSON keys | Verified preservation |
| CSV Total FR-002, AC-002 | parseCsv state transitions; quoting/header/BOM/malformed cases plus native boundaries | Verified for stated grammar cases |
| CSV Total FR-003, AC-003 | BigInt cents and decimal rendering; large value, refund zero, invalid forms and native boundaries | Verified for stated values |
| CSV Total FR-004, AC-004 | usage/read/parse error boundaries; fixed cases and UTF-8/directory checks | Verified locally |
| CSV Total NFR-001, AC-005 | evaluator byte/path checks; source uses only fs and built-in numeric/text facilities | Verified within source/case scope; network isolation was not instrumented |

These examples cover small Node CLIs. Full-template applications remain covered
by the existing structural fixture, not by a new browser trial. Python/other
languages, live services, model/provider quality, latency/cost comparisons,
physical devices, deployment and owner acceptance are UNVERIFIED here.
