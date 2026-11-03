# CSV Total: existing-product repair

An expense export CLI already accepts `node candidate.mjs <csv-file>` and emits
`{"rows":number,"total":"0.00"}` plus newline. Keep that interface and input
files unchanged. The existing `before.mjs` uses comma splitting and floating
point accumulation. It fails on quoted descriptions and accepts invalid amounts.

Repair the behavior using a dependency-free Node.js implementation. The UTF-8
CSV has the exact header `item,amount`, then two fields per record. Support LF,
CRLF, quoted commas/newlines, escaped double quotes, a final line ending and
an optional UTF-8 BOM. Empty data after a valid header is allowed. Reject a
wrong header, malformed quoting, missing/extra fields and invalid decimal amounts.

Amounts are optional minus, one or more digits, and optionally a decimal point
with one or two digits. Convert to integer cents and sum exactly, including
refunds and amounts larger than JavaScript's safe integer limit. Render exactly
two decimal places; zero is `0.00`. Whitespace, exponent notation, NaN, formulas,
and more than two fractional digits are invalid amounts. Descriptions are inert.

Success exits 0 with empty stderr. Invalid CSV exits 1 with empty stdout and
`Invalid CSV` plus newline. Unreadable/non-file/invalid-UTF-8 input exits 1 with
`Cannot read input` plus newline. Wrong argument count exits 2 with
`Invalid arguments` plus newline. No input file is ever modified.

Preserve the baseline and stable requirement IDs in the change PRD. Freeze
`case.json` before implementing the repair. Run both implementations against the
same cases and retain the failed baseline result. This fixture reproduces an
ordinary CSV integration defect; it is not evidence of a live customer's loss.
