# Two-Conversation Forward Test — 2026-09-05

This records one isolated generation-to-build trial of the local 3.0.0 workflow.
It is behavioral evidence for this scenario, separate from deterministic toolkit
regressions. It does not establish universal model or product reliability.

## Scenario And Isolation

Two fresh evaluation agents received no inherited conversation. The first was
given the toolkit entry and a settled brainstorm for LineLens: a dependency-free
Node CLI reading one UTF-8 file and printing JSON line, non-empty-line, and
optional literal-match counts. The supplied scope included empty files, trailing
newlines, LF/CRLF parity, case-sensitive matching, errors, and input preservation.
It was instructed to generate documentation only.

The second received only the generated PRD in a separate empty directory and an
explicit instruction to build until done. It could not read the toolkit, original
brainstorm, or generation artifacts. Both trials stayed in task-owned temporary
directories; no existing target application or host integration was changed.

## Observed Results

| Stage | Evidence | Result |
|---|---|---|
| Generation | Lite PRD, target PROGRESS.md and DECISIONS.md; no code | 6 sections, 5 FR/NFR requirements, 7 ACs, 2 milestones |
| Structural preflight | Generated PRD and completed builder PRD checked | Exit 0; zero findings |
| Fresh build | Native plan, implementation, README, tests, progress and audit | Completed without a second approval or toolkit runner artifacts |
| Behavioral suite | Node v22.23.1, UID 501; `node --test` | 8 reported tests: 7 subtests plus parent; 8 pass, 0 fail, 0 skip |
| Direct CLI trials | 8 separate success/error invocations | Expected outputs/exits; applicable input bytes and mtime unchanged |
| Final audit | Every FR/NFR/AC mapped to source and evidence | All 12 IDs covered; no unrun required acceptance check |
| Independent review | Four source hashes checked against the receipt; real CLI rerun | All matched; exact expected JSON, exit 0, empty stderr |

Coverage included empty/newline boundaries, literal filters, option errors,
missing/directory/invalid-UTF-8 inputs, actual permission denial under the current
identity, and unchanged input bytes/mtime. Tests used no packages or services.
Source review found no product network API; runtime network isolation was not
independently instrumented. The unreadable fixture was created for the test;
existing permissions, identities, credentials, and global settings were untouched.

The generation trial exposed an exact `Review Focus` heading expectation and a
validator phrase that assumed runner approval. Templates/guidance now state the
heading, and validation accepts explicit scoped native build authority. These
were repaired before the fresh-build trial, with focused regression coverage for
native authority. This was a formative trial, not a blind benchmark.

## Evidence Location And Identity

Temporary generation files: `temporary local evidence directory (not distributed)`.
Temporary build and raw evidence: `temporary local evidence directory (not distributed)`,
including `IMPLEMENTATION_AUDIT.md`, `evidence/verification.json`, and
`evidence/test-output.tap`. These temporary artifacts may be removed by host
cleanup; this report preserves the result and source identities, not a packaged
reproduction of the sample application.

| Built source | SHA-256 verified against the receipt |
|---|---|
| linelens.mjs | ed8a961ff47b0c1caca939823f4ecb8dc1e75ab300a7714886793173967344ec |
| count-lines.mjs | d35369ba3f1406b6eb864130966f237cc5bef7329a090f05271622c1120f3de9 |
| test/linelens.test.mjs | 72109a6e35453731752f17327c5c7bb9ce362cfcdf4d8b1b556fc42846496fbd |
| README.md | 8d33373fe745e805d967a5af14b808dc7061f2998a4747c3e8ba8af766319c40 |

Independent command: `node linelens.mjs README.md --contains LineLens` in the
build directory. Output: `{"totalLines":25,"nonEmptyLines":16,"matchingLines":4}`.

## Context Measurements And Limits

Compared with the pre-edit 2.3.1 snapshot, the shared skill entry decreased from
16,793 to 4,702 bytes (72.0%). Default build guidance decreased from 17,084 bytes
(executor plus mandatory runner guide) to 4,659 bytes (native executor), a 72.7%
reduction. These are UTF-8 instruction-file sizes, not measured total prompt
tokens, reasoning usage, wall-clock improvements, model bills, or quality scores.

UNVERIFIED: other models/hosts, Full-template product builds, UI/backend/provider
integrations, cross-platform behavior, extreme inputs, forced cancellation,
automatic folder/skill discovery, live third-party adapters, owner acceptance,
deployment, production readiness, and total token/cost savings. One small CLI
trial cannot establish those claims. Local toolkit check results are recorded in
[toolkit progress](../PROGRESS.md).
