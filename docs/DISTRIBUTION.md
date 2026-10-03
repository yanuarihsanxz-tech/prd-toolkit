# Git Distribution

The distribution unit is this toolkit checkout: prompts, templates, schemas and
Node.js commands. It needs no web deployment or npm installation. Node.js 20+
is required for validation. Start with [README](../README.md).

## Prepare A Clean Checkout

Run from the toolkit root:

```bash
npm run check
node scripts/export-toolkit.mjs /absolute/path/to/new-prd-toolkit
```

The destination must not exist. The exporter copies only the canonical inventory,
checks the copied toolkit and verifies identical source fingerprints. Each export
includes generated DISTRIBUTION.json with version, source fingerprint and SHA-256
of every canonical file. It excludes itself from that inventory. Local
`runs/`, media, credentials, dependencies, runner state and Git metadata are not
included. Original files remain in place. The fingerprint identifies inventory
bytes; it is not a signature, exhaustive secret scan, or proof of product readiness.

Verify a downloaded/exported directory before using it:

Verification requires exactly the canonical files plus DISTRIBUTION.json,
rejects symlinks inside the package, and checks every recorded hash. Local
additions after installation make the directory differ from the release; verify
an untouched export when checking release identity.

```bash
node scripts/export-toolkit.mjs --verify /absolute/path/to/exported-prd-maker
```

Compare the archive's SHA-256 against the release checksum using `shasum -a 256`
on macOS, `sha256sum` on Linux, or `Get-FileHash -Algorithm SHA256` in PowerShell.
The release notes identify the full source commit. Pin that commit for repeatable
Git checkouts; a movable tag alone is not immutable identity. Content hashes
are not publisher signatures or permission evidence.

Run `npm run check` again in the exported directory. Use that folder as the root
of a separate Git repository without the parent workspace's unrelated applications
or history. Never stage the entire parent workspace for this toolkit.

## Public GitHub Publication

This toolkit is intended for public reuse under the [MIT license](../LICENSE).
The source contains toolkit documents, code, examples and tests. Private
conversation logs, author-specific paths, generated media and application data
are excluded. `private: true` in package.json prevents accidental npm publication;
it does not prevent a public GitHub repository.

The published repository is
[yanuarihsanxz-tech/prd-toolkit](https://github.com/yanuarihsanxz-tech/prd-toolkit).
The commands below are for publishing a new fork or a different repository from
a clean exported checkout after GitHub authentication. Do not repeat them for
the existing public repository:

```bash
git init -b main
git add .
git commit -m "Prepare PRD Toolkit for public use"
gh repo create prd-toolkit --public --source=. --remote=origin --push
```

Use an existing intended remote instead if that repository already exists; do
not overwrite someone else's repository or push the parent workspace. Confirm
the repository page and Actions results after publication. A prepared checkout
alone is not evidence of a successful upload.

## Release An Existing Repository

Work in an isolated checkout of the verified intended repository. Preserve
unrelated local work. Run checks, review the exact diff, and commit only intended
canonical files. Push normally under actual repository rules; use a pull request
when required. Never force-push or bypass protection. Verify hosted CI for the
exact source commit before publishing a version tag/release.

Export the committed source into a new directory named `prd-maker`, then archive
that directory with its DISTRIBUTION.json. Extract the archive somewhere else,
run manifest verification and the full check there, and exercise the documented
commands. Publish that tested archive, its SHA-256 and a receipt binding the
archive to the full commit, content fingerprint and check results. Download the
published asset and compare its hash with the tested copy. A GitHub source ZIP
is distinct from this tested release artifact and may lack the generated manifest.

The toolkit remains dependency-free. Archive creation is a maintainer task;
no hosting service, remote installer, credentials or npm publication is needed
for local use. Preserve failed verification attempts outside canonical source.

## Continuous Checks And Limits

GitHub Actions runs `npm run check` on Node 20, 22 and 24 across Linux, macOS and
Windows. The toolkit checks need no install, credentials or API access. See
[PROGRESS](../PROGRESS.md) for the last verified hosted run; inspect the current
commit's Actions result before claiming that commit passed.

The export test exercises a path containing spaces, an unrelated working
directory, both PRD examples, source identity and overwrite refusal. Other tests
cover malformed PRDs and the optional runner's failure, retry, approval and
mutation behavior. Representative examples do not invoke a model or prove a
generated application's live providers, deployment or user acceptance.

## Portable Paths And Document Types

Replace `/absolute/path/to/prd-toolkit` in command examples with your checkout.
Layouts resolve the toolkit root from their source file. Optional Reasonix
commands do likewise; live Reasonix discovery remains unverified.

Validate completed generated PRDs with `scripts/validate-prd.mjs`. Templates have
intentional placeholders and are checked by `scripts/validate-toolkit.mjs`.
Historical PRDs in another format require content review before migration;
schema failure alone does not prove their product requirements wrong.

Frontmatter supports simple scalars and indented block lists as used by the
templates. It is a bounded parser, not a general YAML or Markdown engine.
Credential-pattern checks are heuristic and do not replace review of the exact
files being published.
