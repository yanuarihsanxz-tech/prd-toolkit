# Line Summary: new CLI

Build a small dependency-free Node.js CLI for inspecting exported text notes.
Invocation: `node candidate.mjs <file> [--contains <literal>]`. Read one UTF-8
file without changing it. Return exactly one JSON object and a newline with
`lines`, `non_empty`, and `matching` (null when no filter was requested).

An empty file has zero lines. A final LF ends the previous line rather than
creating another line. Consecutive line endings represent empty lines. Treat
CRLF and LF identically. A nonempty line contains at least one non-whitespace
character. Matching is case-sensitive, literal substring matching per line;
an empty literal matches every line. Unicode and shell metacharacters are data.

Usage errors exit 2, with empty stdout and `Invalid arguments` plus newline on
stderr. Missing/unreadable/non-file/invalid-UTF-8 input exits 1 with empty stdout
and `Cannot read input` plus newline on stderr. Success exits 0 with empty stderr.
No writes, network, dependencies, recursive directory scans or UI are needed.

The fixed `case.json` is the acceptance oracle. Prepare a Lite PRD first; record
scope and errors explicitly. Then a separately authorized build can implement
it and run the evaluator. This is a reproducible task fixture, not a claimed
customer deployment or an independent model benchmark.
