# Portable workflow

Use the existing model and coding host. The toolkit needs Node.js 20+ for its
commands, no package installation, API key or provider. `npm run prd -- ...`
is equivalent to `node scripts/prd.mjs ...` from the checkout. Direct script
paths continue to work and retain their exit codes.

## Prepare instructions for an assistant

If the assistant can read the checkout, reference SKILL.md as usual. When it
cannot, prepare a Markdown packet for the operation you actually want:

```bash
node scripts/prd.mjs context generate --type app --out ../app-instructions.md
node scripts/prd.mjs context improve --type tool --out ../revision-instructions.md
```

Attach that packet with your brief/current PRD and relevant project evidence.
Save it outside the toolkit checkout, as in these sibling-file examples, or in
an existing ignored `runs/` directory. The toolkit's documentation validator
checks Markdown inside the checkout; generated packets contain embedded relative
references and are not standalone toolkit documentation.
It includes canonical files unchanged, selected by operation, plus their hashes.
It does not inspect your project, collect credentials, install skills, invoke a
model or generate a PRD. Existing output paths, including symlinks, are refused.
Inspect packets before sharing, just as you would inspect project attachments.

| Operation | User outcome |
|---|---|
| `discover` | Persist research for a later conversation when needed |
| `generate` | Write a new specification, summary and product flow |
| `review` | Review a supplied PRD without editing it |
| `improve` | Revise a supplied PRD while preserving scope and IDs |
| `build` | Instructions for an explicitly requested build from a supplied PRD |
| `audit` | Review implementation evidence against a supplied PRD |

`--type app` includes Full, `--type tool` includes Lite. Omit it to include
both for agent selection. `--change` adds existing-product/bug contracts;
improve already includes them. `--reliability` adds detailed guidance for
material state, provider or recovery concerns. No option changes user authority.

Relative file references in a packet identify embedded source labels. Executable
checks still need the actual checkout: a Markdown packet is not a runtime.
Conditional guides omitted from a packet must be obtained when relevant, or
the specific gap must be reported. A chat-only assistant can return a PRD as text;
it cannot honestly claim file writes, structural execution or product tests.
For build/audit, attach the completed self-contained PRD. Managed runner state
still requires the original runner and full guide; no packet bypasses it.

## Run the existing checks

```bash
node scripts/prd.mjs validate PRD.md --json
node scripts/prd.mjs compare baseline.md PRD.md --json --fail-on-removal
node scripts/prd.mjs preview PRD.md
node scripts/prd.mjs check --json
npm run check
```

The first four commands are read-only. `check` validates toolkit structure;
`npm run check` also runs its tests. A structural pass does not prove product
behavior. No alias silently runs or approves the optional task runner.
The npm scripts enumerate the toolkit's `tests/*.test.mjs` files explicitly;
saved exports under `runs/` are not discovered as duplicate tests.

## Evaluate a real program

The evaluator runs any explicitly supplied trusted executable with fixed cases.
It is useful for CLI, batch and script interfaces regardless of implementation
language or generating model. Browser and live-provider behavior still need
their own tools and evidence.

```bash
node scripts/prd.mjs evaluate evals/real-cases/line-summary/case.json --json -- node /absolute/path/to/candidate.mjs
```

Use absolute program paths: each test executes in a fresh temporary directory.
The executable comes from the command line; case files cannot contain commands.
Arguments are passed directly without a shell. This executes code with your
permissions; the temporary working directory is **not a security sandbox**.
Run only trusted local candidates. Candidates must terminate their descendants.

Each data-only case file has this shape:

```json
{
  "schema_version": 1,
  "id": "greeting",
  "description": "A concrete interface contract",
  "timeout_ms": 3000,
  "tests": [
    {
      "id": "ordinary-input",
      "args": ["input.txt"],
      "files": { "input.txt": "Ada\n" },
      "expect": { "exit": 0, "stdout": "Hello Ada\n", "stderr": "" }
    }
  ]
}
```

- `args` is a string array appended to the command. Optional `stdin` is a string.
- `files` creates UTF-8 fixtures at relative paths. Traversal, absolute paths,
  backslashes, control characters, drive prefixes, Windows reserved names and
  non-portable filename characters are rejected on every platform. Case or Unicode
  normalization collisions and file/directory path conflicts are also rejected.
- `expect.exit` and exact `expect.stderr` are required. Choose **one** of exact
  `expect.stdout` or `expect.json` (parsed deep equality; JSON key order is ignored).
- Input bytes must remain unchanged. Optional `expect.files` declares exact
  new/changed file contents. Missing files, unexpected paths and symlink outputs
  fail. Only declared UTF-8 file artifacts are supported, not binary streams.
- Cases must use unique nonempty IDs and reject unknown fields. CLI manifests
  are limited to 2 MiB; individual fixture strings to 1 MiB, suites to 100 cases,
  per-case timeout to 30 seconds, and captured stdout/stderr to 1 MiB each.
  These are evaluator resource limits, not product performance claims.

Exit 0 means all cases passed and recorded entry files stayed unchanged. Exit 1
means behavioral/source-stability failure; exit 2 means malformed input or an
unlaunchable command. JSON reports record case bytes' SHA-256, exact invocation,
hashes for absolute file arguments, evaluator environment, per-case result and
elapsed milliseconds. They omit candidate stdout/stderr; failure codes identify
the assertion to reproduce. Do not pass secrets as command arguments or fixtures.
Entry hashes do not cover imports, dependencies or external services. When no
absolute file arguments are available to hash, `entry_files` is empty and
`source_unchanged` is null, not a claim of verified source identity.

Freeze cases before changing the implementation. Run baseline and candidate on
the same machine, command contract and case hash; preserve failed attempts.
Newly discovered requirements get a new case revision, followed by another
paired run. Never edit expected values just to make a candidate pass. Structural
checks, program correctness on these inputs, human judgment, and cross-model
quality are distinct evidence. See the [retained trials](../evals/real-cases/README.md).
