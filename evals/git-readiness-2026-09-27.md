# Git Readiness Audit — 2026-09-27

## Scope And Verdict

Local PRD Toolkit 3.0.3 is prepared for a public Git repository under MIT.
The reviewed distribution has 64 explicitly selected files. Application
repositories elsewhere in the parent workspace are outside this change.
The MIT license was selected with owner authorization. Remote publication
requires an authenticated GitHub account; no successful push is claimed.

## Findings And Repairs

| Finding | Evidence | Resolution |
|---|---|---|
| Hidden requirements accepted | Commenting out the Lite functional-requirement table returned valid before the fix | Contract tables, numbered sections, core text and authority checks now use visible Markdown |
| Empty requirement and criterion cells | IDs alone could establish coverage despite empty behavior text | Explicit incomplete-row findings and regression checks |
| CLI silently skipped through aliases | Export test returned exit 0 and empty stdout through a symlinked temporary path | Resolve the invoked script's real path in both validators, runner and exporter |
| Machine-specific operation paths | Layouts and seven Reasonix commands referenced the original author's checkout | Resolve toolkit paths from document location; onboarding examples use a replaceable absolute path |
| Unrelated run assets in toolkit | Local runs included generated pet images and prompts | Keep originals, ignore run/output directories and export only the canonical inventory |
| Shell-dependent test glob | Package command relied on shell wildcard expansion | Use Node test-directory discovery, retaining dependency-free execution |
| No clean distribution check | Prior tests ran only against the development folder | Export tests exercise relocation, paths with spaces, aliases, source identity and overwrite refusal |

## Verification

- macOS arm64, Node v26.8.1: all 40 tests pass, none skipped.
- Toolkit structural check: zero findings; all 12 generator regression cases pass.
- Complete `npm run check` also passes from a clean exported checkout.
- Both Full and Lite example CLIs pass from a different working directory.
- Existing runner tests cover ordering, failure blocks, retries, fingerprint
  mutation, bounded authority, production refusal and attempt preservation.
- Direct credential-pattern scan of distribution sources found no matches for
  the AWS/GitHub/OpenAI token and private-key patterns checked. This is a bounded
  heuristic, not a guarantee that no sensitive information exists.
- Historical reports retain their dates and limitations; private temporary paths
  are omitted from public copies. No prior results were
  reclassified as current model or runtime evidence.

Use `node scripts/validate-toolkit.mjs --json` for the exact current source
fingerprint. A hash is not embedded here because this report is itself part of
that fingerprint. Rerun `npm run check` after any later edit.

## Limits And Next Action

GitHub Actions configuration covers Linux/macOS/Windows and Node 20/22/24.
Those hosted jobs have not run. The current local Node version does not prove
older-version or other-OS behavior. Live Reasonix activation, all three IDEs,
new model generation, Full application builds and provider integration remain
unverified by this maintenance run. The 2026-09-05 forward trial remains
historical evidence for its isolated Lite scenario only.

Templates intentionally contain placeholders; examples and generated PRDs have
different validation roles. A legacy external PRD failing this schema is not
automatically a defective product specification.

Public visibility and repository name prd-toolkit are authorized. Private logs
and unrelated assets have been preserved outside this public source tree.
GitHub authentication is still required to publish. See
[distribution instructions](../docs/DISTRIBUTION.md).
