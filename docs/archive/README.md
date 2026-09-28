# Documentation Archive Policy

This directory is the only archive destination for superseded PRD Toolkit
documentation. It is currently empty; no current canonical or evidence document
was moved merely to create a baseline.

## What Belongs Here

- A superseded onboarding, architecture, prompt-explanation, or maintenance
  document whose current replacement is identified.
- Historical snapshots that remain useful for provenance but must no longer be
  treated as current instruction.
- Migration notes for a retired major contract when preserving them prevents
  older evidence from being misread.

Do not archive root `DECISIONS.md` or `PROGRESS.md`, current schemas, active
templates, executable scripts, tests, or the only copy of accepted evidence.

## Required Archive Metadata

Every archived Markdown document must begin with:

```yaml
---
archive_status: historical
archived_at: "YYYY-MM-DD"
superseded_by: "repository-relative/path.md"
reason: "Specific reason the document is no longer canonical"
---
```

`superseded_by` must resolve to a current repository file. A document with no
known replacement remains current or requires an explicit owner decision; it
must not be archived to hide ambiguity.

## Archive Procedure

1. Record or cite the decision that supersedes the document.
2. Add the required metadata and preserve the historical content unchanged
   except for an archive notice and link corrections needed for readability.
3. Move the document to `docs/archive/YYYY/` without creating a second
   authoritative copy.
4. Update `docs/INDEX.md`, all inbound local links, and `CHANGELOG.md`.
5. Run `npm run check` and confirm zero broken local links or archive metadata
   findings.
6. Create a Git commit, tag, or external release only with separate explicit
   authorization.

## Interpretation Rule

Archived content is non-authoritative. It may support historical reasoning, but
cannot override accepted decisions, current schemas, canonical prompts, or
source-state-bound validation evidence.

## Inventory

| Archived document | Superseded by | Archived at | Reason |
|---|---|---|---|
| None | N/A - no document archived in the `1.0.0` baseline | N/A | Current documents retain distinct owners. |
