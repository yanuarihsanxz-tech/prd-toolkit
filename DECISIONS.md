# Toolkit Decisions

These decisions describe the toolkit's current design. A project's requirements,
permissions and progress belong to that target project, not this repository.
Historical conversation transcripts and private development logs are excluded
from the public source tree; this document preserves their applicable outcomes.

| Decision | Rationale |
|---|---|
| Files-only, dependency-free Node validation | A coding host supplies generation and execution; no second agent runtime is required. |
| One conversation to resolve scope; a fresh conversation to build | A generated PRD carries the required context and verification contract. |
| Full for product UI; Lite for CLI, automation and API-only work | Keep stable 10/6 section contracts while scaling detail to actual risk. |
| Native execution by default | An explicit build request authorizes scoped local implementation and verification without repeated routine approvals. |
| Optional stateful runner | Existing runner state retains fingerprint, retry, ordering and authority contracts; it cannot be bypassed by switching modes. |
| Requirements and evidence remain separate | A structural pass does not establish factual correctness, runtime operation or acceptance. |
| Conditional tools and reliability controls | Use only capabilities justified by the target product and actually available on the host. |
| Progressive verification | Focused checks while implementing, followed by an integrated audit of all required outcomes. |
| Portable public distribution | Include toolkit source, documentation, examples and tests; exclude application data, personal logs and generated assets. |

## Public release

On 2026-09-27 the owner authorized public GitHub distribution, delegated license
selection and accepted the proposed repository name. MIT is the distribution
license; the proposed repository is prd-toolkit. Authentication is required for
the actual push.

## Owner handoff and contributions

On 2026-09-27 the owner requested a readable summary and flowchart after PRD
generation, plus useful public contribution support. Version 3.1.0 reuses the
saved product flow in the final response and provides an optional read-only
preview command. Issue/PR templates and first-contribution guidance keep feedback
reproducible without adding a second framework or runtime dependency.

## Specification-only default entry

The owner clarified that the toolkit is invoked at the initial PRD stage and
should not require a long prompt. Patch 3.1.1 makes summary, flowchart and
validation automatic, infers new/rework/bug-fix specification context, honors
analysis-only intent, and removes application build/debug routing from the
normal entry. Existing explicit utilities and generated builder contracts remain.

## Maintenance

Patch 3.1.2 keeps the toolkit a specification base. The owner requested local
improvements before their own Git publication. Capability selection lives in the
existing routing guide; evidence quality lives in the reliability guide.
Full/Lite still selects product shape, with depth proportional to risk. No
scanner, installer or mandatory browser harness is added. Behavioral and usage
improvements require measured trials; instruction edits alone do not prove them.

Record material design changes here and in CHANGELOG.md. Current user authority
and platform instructions take precedence over historical decisions. Preserve
existing runner evidence and supported contracts when changing implementation.

## 3.2 Change-aware specifications — 2026-10-02

The owner initially authorized implementation and publication to the verified
repository. Their later 2026-10-02 instruction restricts this task to updating
the live local toolkit; the owner will publish it. Retain a tested local
distribution and recovery copy, and do not push, tag or create a release.
Use a minor release: comparison is additive, authority v1 is opt-in for legacy
PRDs, and Full/Lite and runner contracts remain compatible. Keep the verified
v3 parser; only fix concrete integrated defects with focused regression tests.

A Change Contract stays inside the existing PRD. Preserve current evidence,
interfaces/data/behavior, continuing IDs and retirement history; original bug
reproducers are part of verification. A comparison cannot prove semantic
identity or preserved behavior in code. Fixed authority wording belongs to one
versioned module; normalization changes formatting only and does not grant any
actual authority.

Retain existing operation paths and governance ownership. A new compact profile
or reorganized runner would require observed handoff benefits and a migration
case; shorter text alone does not justify another format. Use proportional
Full/Lite output and investigate its outcomes in isolated evaluations. Keep
unavailable host/model metrics and unperformed checks explicit.

Recover interrupted work from the saved implementation commit and keep new
verification evidence under durable local runs. The earlier temporary evaluation
artifacts are no longer available: preserve the observations recorded in the
conversation, distinguish them from fresh checks, and do not invent replacement
raw logs or a completed builder audit.

## Public update authorization — 2026-10-03

The owner now requests pushing the final 3.2.0 toolkit to the existing public
repository and aligning public descriptions. This supersedes the earlier
local-only delivery instruction for source publication. Preserve prior local
work and publish through a normal push under repository rules; verify the exact
remote commit and hosted checks. Version tags and release assets remain distinct
actions and are not inferred from the source push.
