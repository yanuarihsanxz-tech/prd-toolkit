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
