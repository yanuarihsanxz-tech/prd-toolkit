# Authority Policy Format

New PRDs declare `authority_policy: 1` in YAML frontmatter and contain exactly
one visible `### Authority Policy v1` subsection inside Architecture or
Milestones. Copy the block from the selected template. The canonical constant
is [authority-policy.mjs](../scripts/authority-policy.mjs); toolkit validation
checks that both templates conform to it.

This is fixed, versioned format enforcement. A matching block is not evidence
of real user authorization, host permission, runner approval, or owner
acceptance. Those come from the actual session, platform and runner state.
The validator reports this limit even when validation succeeds.

## Matching And Compatibility

The validator normalizes CRLF, nonbreaking spaces, blockquote/list markers,
bold/italic markers, backticks, curly quotes, en/em dashes and whitespace.
It then compares the whole block with the canonical sentences, case-sensitively
and in order. It does not accept synonyms, paraphrases, changed negation,
extra sentences, hidden examples, duplicates or misplaced blocks.

| Declaration | Behavior |
|---|---|
| `authority_policy: 1` | Require the canonical visible block; mismatch is blocker `MILESTONE_AUTHORITY_POLICY`. |
| Field absent | Retain pre-3.2 legacy wording checks and emit non-blocking `AUTHORITY_POLICY_LEGACY`. |
| Unknown version or wrong type | Block with `AUTHORITY_POLICY_VERSION_UNSUPPORTED`; never fall back silently. |

To migrate an existing PRD, review its authority constraints, preserve any
stronger product-specific limits outside this block, add the canonical block
from a current template and declare version 1. Run structural validation and
review its findings. No automatic rewrite or new approval occurs. Legacy
compatibility will only be removed in a later major release.

Full/Lite section counts and frontmatter schema identity remain unchanged:
the new field is optional. Runner plan/state schemas remain version 2.
Existing runner approvals, fingerprints, attempts and failure blocks are not
migrated, recreated or bypassed by this document format.
