# 3.2.0 Local Verification

Date: 2026-10-02. This report records the local-delivery stage before the later
publication request. No 3.2.0 push, tag, GitHub release, hosted CI result or deployment
was claimed at that stage. Current publication evidence is in
[PROGRESS.md](../PROGRESS.md). This report distinguishes fresh local checks from observations in
earlier interrupted sessions.

## Source And Recovery

The original live toolkit, supplied 70-file snapshot and upstream source at
`3e827d926cb0e0c71c598c29af90003cab90a1ed` matched before maintenance. The
implementation was saved in local commit
`4b21992c82625cca7f914ca1e50c2d069fd2d0c7` before the temporary worktree became
unavailable. Recovery checked the live files against that baseline, retained a
70-file recovery ZIP, and restored all 79 canonical files into the live toolkit.
The separate checkout's pre-existing changes and unrelated parent Git state
were preserved. Delivery-status documentation was then updated for local use.

The portable distribution adds DISTRIBUTION.json with a source fingerprint and
per-file SHA-256 hashes. Its identity covers the final local bytes, including
documentation edits after the recovered commit. The local delivery receipt
records the final archive hash and verification; the recovery commit alone does
not identify those later documentation edits.

## Fresh Deterministic Evidence

The restored live toolkit passed `npm run check`: 113 tests, all 12 structural
regression cases, no skips and no toolkit findings on macOS arm64 / Node 26.8.1.
The original 56 v3 comparison tests remain unchanged. Coverage includes actual
Full/Lite examples, typed template ACs, combined Lite FR/NFR rows, changed
evidence, malformed input, removal exits, retirement history, safe authority
normalization, legacy policy behavior, CLI help/version, stdin imports,
symlinked entry points, distribution identity and the existing runner contracts.

Full/Lite examples have 40/27 active comparison entries. Legacy PRDs without
`authority_policy` retain the prior wording checks and a non-blocking
AUTHORITY_POLICY_LEGACY notice. New PRDs use fixed format v1; unsupported
versions or altered policy text fail. A format match never supplies real user
authorization, host permission, runner approval or owner acceptance.

The final local delivery process validates the current source, exports only the
canonical inventory, creates an archive, extracts it into another directory,
verifies the manifest and runs the full check from that extracted copy. It also
exercises validation, preview, comparison and CLI help from an unrelated working
directory. Actual commands, exit codes, hashes and archive results are retained
under local runs and beside the distribution. These receipts identify the tested
bytes; structural results do not establish product truth or production readiness.

Concrete failures found and fixed during integration included the initial Lite
policy placement, unsupported typed/combined template tables, an overly broad
malformed-delta check that rejected legacy milestone rows, and stdin imports
that tried to resolve `-` as a filename. Focused regressions and the full suite
passed after the repairs. No wholesale rewrite of the verified v3 parser occurred.

## Earlier Model Trials — Historical Evidence

The prior session generated three Lite PRDs and their progress/decision
companions, then handed only those files and original application source to a
fresh builder. Briefs, earlier conversation and independently defined tests
were withheld from the builder. The frozen generation candidate had fingerprint
`manifest-sha256:b8ce6d022de4bc7f8e9367aab4a55c6e0b9a3755e992e6c9bd73569a9cc71416`.
Later integration fixes and documentation edits mean this was not a generation
trial of the final delivered source.

| Scenario | Observed result in the earlier session |
|---|---|
| Existing catalog change | JSON/API/order/Unicode preservation, CSV escaping and retired text-flag rejection passed independent tests. Comparison retained four continuing definitions and FR-009 history, and recorded two intended removals. |
| Pagination bug | The original [1,2,3,4,5], page 1, size 2 failure was reproduced; repaired page and boundary results, validation and CLI behavior passed independent tests. |
| Complex Python resampling | Half-open intervals, TTL gaps, clipping, duplicates, nonmutation, schema errors and four-place half-even means passed independent examples and 30 deterministic reference scenarios. |

All three generated PRDs passed structural validation with no findings. The
withheld suite passed 12 test methods in 2.291 seconds of process wall time.
Its expectations were fixed before generation, with SHA-256
`070ea54d33ab0e99efbb1b6e682d9eba63f7fe4551086ee50adfd7d2b53d6e89`.
Builder-owned suites also passed after correcting a test probe that accidentally
blocked Node's own module loader. These observations are preserved in the
conversation's tool outputs; they are not new results from this resumed run.

**Evidence limitation:** the temporary generator/builder directories and raw
logs were no longer present when local delivery resumed. They cannot currently
be inspected or replayed. The builder CLI ended with exit 1 during its final
audit; no completed final audit was observed. Its exact exit cause is unverified
without the raw output. Do not describe these trials as a completed end-to-end
builder audit or as independently reproducible current artifacts.

The host was Codex CLI 0.159.2, configured with `gpt-6-astra` and `max` effort,
using local files/shell, Node 26.8.1 and Python 3.12.3. An independently verifiable
served-model snapshot was not emitted. The generator explicitly read the
exported skill through a project-local symlink; automatic discovery without an
explicit path was not isolated. Claude Code and Reasonix execution were not
tested. No new model runs were launched for this local recovery.

| Invocation | Observed measurement |
|---|---|
| First generator launch | Failed to initialize the local app server under the outer sandbox; exit 1 after 0.043 s. |
| Second generator attempt | Interrupted with two saved drafts; complete usage and exact elapsed time unavailable. |
| Generation continuation | Exit 0; 1,460.285 s; CLI counters: 1,117,243 input, 1,000,064 cached input, 34,773 output and 9,456 reasoning output tokens. |
| Fresh builder | Exit 1 after 1,489.189 s; implementation and runtime passes were observed before the final audit stopped; complete token counters unavailable. |

Token categories are reported as emitted, not added together or converted to
money. Complete generation cost, billing and total task time are unavailable.
A single interrupted batch cannot establish causal improvement, broad model
performance or savings. No controlled compact-profile, cross-model, Full UI,
live-provider or deployment evaluation was performed.

## Compatibility And Product Judgment

Version 3.2.0 adds comparison and authority format without changing Full/Lite
section counts or runner plan/state schema v2. Legacy PRDs remain supported;
no IDs, approvals, fingerprints or attempt history are silently migrated.
Retirement history and original bug reproducers remain part of change review.

Full/Lite and existing operation paths are retained. The trial documents were
substantial, but shorter text alone would not prove a compact profile improves
handoffs. No new profile, dependency or runner migration was introduced without
such evidence. Current local checks establish the named toolkit contracts;
model performance, untested host integrations and owner acceptance remain
separate claims. Current publication status is recorded in [PROGRESS.md](../PROGRESS.md).
