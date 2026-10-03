# Change Contract (rework and bug-fix PRDs)

Use this block inside a PRD when the work changes an existing product. It is a
subsection of an existing PRD section, not a new top-level section (the
validator counts sections: Full has 10, Lite has 6). It describes intent; the
builder still verifies behavior at runtime.

## Required content

| Part | What to record |
| --- | --- |
| Current behavior | What the product does today, with evidence (file, command, observed output) and what was **not** inspected |
| Requested change | The outcome wanted, and the FR/NFR/AC IDs it touches |
| Preserved behavior | Behavior, interfaces, data formats, and constraints that must not change |
| Delta table | One row per affected requirement: `added`, `modified`, `removed`, `unchanged` (`retired` is accepted as a synonym of `removed`) |
| Verification | Checks for the requested change **and** for affected preserved behavior |
| Bug only | The original reproducer and the expected result after repair |

## Delta table

The delta table uses exactly the headers `ID | Status | Note`:

```markdown
| ID | Status | Note |
| --- | --- | --- |
| FR-001 | unchanged | |
| FR-002 | modified | Persistence now survives unreadable data via reset action |
| FR-004 | removed | Retired; ID is not reused |
| FR-007 | added | Reset action |
```

## Active definitions versus records

`compare-prd` compares **active definitions** only. Each ID has at most one
active definition per PRD. Everything else that mentions an ID is a record or a
reference and never counts as a definition, wherever it appears in the file.

| Kind | Recognized by | Counts as an active definition? |
| --- | --- | --- |
| FR table row | header `ID \| Requirement \| Priority \| Acceptance Criteria IDs` | Yes |
| NFR table row | header `ID \| Category \| Requirement \| Target \| Acceptance Criteria IDs` | Yes |
| AC table row | header `ID \| Requirement IDs \| Observable Criterion \| Required Evidence` | Yes |
| Template variants | FR table may add `Rationale` before AC IDs; AC table may add `Type` before Observable Criterion; the four-column requirement table also accepts Lite's combined FR/NFR rows | Yes; every column is compared |
| Simple criterion table row | header `ID \| <Requirement, Criterion, Acceptance Criterion, Observable Criterion, or Description> \| ...` | Yes |
| Bullet, numbered item, or heading | an explicit marker (`-`, `*`, `+`, `1.`, or `#` heading), then the ID, with definition text (continuation text included) | Yes |
| Delta table row | header `ID \| Status \| Note` | **No** (change record) |
| Retirement record | delta row with status `removed` or `retired` | **No** (history; the ID leaves the active set) |
| Reference / traceability table | any other header, for example `ID \| References` | **No** |
| Bare prose line that starts with an ID (`FR-002: See FR-001 for details.` with no list or heading marker) | no explicit definition syntax | **No** |
| Prose mention; list item that is only references (`- FR-001 -> AC-001`) | no definition text | **No** |
| Anything inside an HTML comment, fenced code, or YAML frontmatter | masked before parsing | **No** |

Because definition rows are recognized by header, the position of a reference or
traceability table relative to the requirements does not matter.

### Where a text definition ends

A heading definition runs until the next heading, the next definition, or the
next table row. A bullet or numbered definition runs through following lines
that are indented deeper than the bullet, and stops at a blank line, a line at
the same or shallower indent, or the next definition. HTML comments and fenced
code blocks are invisible to the comparison but are **not** boundaries: visible
text after a comment or fence still belongs to the definition. Text inside a
comment or fence is excluded from the entry, so a change made only inside one
is not detected.

### Rows that are rejected instead of skipped

In a recognized definitions table (canonical or simple), a row is rejected with
an error, and the whole comparison is invalid, when:

- its first cell is not a single valid ID such as `FR-001` (`FR-1`, `fr-001`,
  `FR-001, FR-002`, an empty cell, or `FR-001 (primary)` all fail);
- its cell count differs from the header (no padding or truncation; escape a
  literal pipe as `\|`);
- its ID prefix does not match the table (`AC-005` in a requirement table).
  The four-column requirement table permits FR and NFR as used by Lite; the
  category/target NFR table still requires NFR IDs.

Fully empty rows are ignored. In a simple `ID | Description` table whose rows do
not use FR/NFR/AC IDs at all (for example `R-001` risks), the rows are ignored
with one warning. In a delta table, a row with a known status but a malformed
or empty requirement ID is an error. Well-formed non-requirement IDs such as
`M-001` remain ignored with a warning for compatibility with milestone tables.

### Duplicate definitions

Duplicates are compared by definition form and normalized fields, not by
flattened text. `AC-001 | Export CSV | Team A` and `AC-001 | Export | CSV Team A`
are different definitions even though their text is the same when joined.
Differing fields or form are an error; identical fields repeated are a warning.

### What "the complete entry" means

For table definitions every column is compared, so a change to requirement text,
priority, category, target, AC mapping, requirement mapping, observable
criterion, or required evidence is reported with the changed field names
(`changedFields`). Columns whose header ends in `IDs` are compared as sets of
IDs, so reordering or re-spacing `AC-002, AC-001` is not a change. For bullet
and heading definitions the entry is the whole text block including
continuation lines.

### Retirement

A retirement record keeps a removed ID in the PRD's history while the active set
no longer contains it. In the comparison, an ID that was active in the old PRD
and is not active in the new one is **removed**, whether or not a retirement
record exists. The record only adds `retirementRecorded: true` and the note.
It does not bypass `--fail-on-removal`. A removal with no record is listed under
`findings.removedWithoutRetirementRecord` for review.

Carry retirement rows into every later revision with their original rationale
and the version in the note. Preserve continuing IDs; never close numbering gaps
or reuse retired IDs for new behavior. `findings.retiredIdReactivated` flags an
old retired ID becoming active. `findings.retirementHistoryDropped` flags an old
retirement absent from both the new active set and its retirement records.
These findings require review even when the CLI exits 0: `--fail-on-removal`
only gates removal from the active set, not every policy violation. A historical
PRD that predates stable IDs needs a reviewed mapping, not a silent renumbering.

Before revising, preserve the old PRD in an immutable repository revision or a
temporary local snapshot and record its identity. The current PRD embeds the
change outcome and relevant preserved contracts; a fresh builder does not need
the toolkit or old conversation. If no baseline specification exists, derive
current behavior from the available code/runtime evidence and state its limits;
do not invent a historical PRD merely to make the comparison command pass.

Generation, improvement and review use this contract; the final implementation
audit checks the requested change, affected preserved behavior, every retirement
and the original bug reproducer. Compare output is supporting evidence alongside
structural validation and product review, not a replacement for either.

## Reviewing a change

```
node scripts/compare-prd.mjs old/PRD.md new/PRD.md
node scripts/compare-prd.mjs old/PRD.md new/PRD.md --json --fail-on-removal
```

| Exit | Meaning |
| --- | --- |
| 0 | Valid comparison produced |
| 1 | Removal detected and `--fail-on-removal` set |
| 2 | Usage error, unreadable file, empty or unsupported input, or ambiguous input |

Invalid input never produces a comparison. With `--json`, invalid input prints
`{ basis, valid: false, diagnostics }` only.

## Diagnostics

Each diagnostic has `severity`, `code`, `file` (`old` or `new`), `line`,
`location` (`path:line`), and `message`.

| Code | Severity | Meaning |
| --- | --- | --- |
| `NO_DEFINITIONS` | error | No active definitions and no retirement records: empty or unsupported input |
| `DUPLICATE_DEFINITION` | error | Two or more active definitions of one ID with different fields or form (lines listed) |
| `DUPLICATE_DEFINITION_IDENTICAL` | warning | Repeated active definitions with identical fields |
| `ROW_ID_INVALID` | error | A definitions-table row does not start with a single valid ID |
| `ROW_CELL_COUNT` | error | A definitions-table row has a different number of cells than its header |
| `KIND_MISMATCH` | error | An ID with the wrong prefix appears in a canonical FR, NFR, or AC table |
| `CHANGE_ROW_INVALID` | error | A delta row has a known status but a malformed requirement ID |
| `RETIRED_BUT_ACTIVE` | error | An ID has both a retirement record and an active definition in one PRD |
| `CONFLICTING_CHANGE_RECORDS` | error | An ID is recorded as removed and also as added, modified, or unchanged |
| `UNCLOSED_FENCE` / `UNCLOSED_COMMENT` | error | The rest of the file would be silently excluded |
| `UNCLOSED_FRONTMATTER` | error | An opening YAML metadata block never closes, making definitions ambiguous |
| `NO_ACTIVE_DEFINITIONS` | warning | Only retirement records were found |
| `UNRECOGNIZED_STATUS_ROWS` | warning | Rows in an `ID \| Status` table that are not change records were ignored |
| `NON_REQUIREMENT_ROWS` | warning | Rows in a simple ID table that do not use FR/NFR/AC IDs were ignored |
| `MALFORMED_ID_LINE` | warning | A list item or heading starts with an ID-like token that is not a valid ID; it is not treated as a definition, and the comparison stays valid |

## Limits

- The comparison is textual and structural. It cannot tell whether two
  differently worded requirements mean the same thing, and it cannot tell
  whether an unchanged requirement is still satisfied by the code.
- `possibleIdReuse` is a non-blocking heuristic: a modified entry is flagged
  when the word overlap (words of three or more characters, ID excluded) falls
  below 0.3. It needs human review. It misses a meaning change that keeps most
  words ("Keep favorites" to "Erase favorites" is reported as modified but not
  flagged), and it can flag a legitimate full rewrite. Short entries make the
  score unstable.
- List items and headings that begin with an ID are definitions. Put references
  in tables with a non-definition header, or write them without a list or
  heading marker or without definition text, to avoid duplicate-definition errors.
- A malformed ID in a list item or heading (`- FR-1: ...`) only warns; the line
  is not compared. Malformed IDs in definitions tables are errors.
- Changes made only inside an HTML comment or fenced code block are not detected.
- A literal pipe in a table cell must be escaped as `\|`, or the row is rejected.
- Indented (four-space) code blocks, tables inside blockquotes, and setext
  headings are not specially handled. Inline code containing `<!--` is treated
  as a comment opener.
- The script is read-only and dependency-free. It never rewrites, merges, or
  commits.
