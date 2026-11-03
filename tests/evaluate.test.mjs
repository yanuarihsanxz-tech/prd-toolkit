import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { evaluate, validateCase } from "../scripts/evaluate.mjs";

const base = () => ({ schema_version: 1, id: "echo", description: "Exact CLI output and file preservation", timeout_ms: 3000, tests: [{ id: "literal", args: ["$(never-run); x & y"], files: { "input.txt": "keep me\n" }, expect: { exit: 0, json: { value: "$(never-run); x & y" }, stderr: "" } }] });
const run = code => [process.execPath, "-e", code];

test("evaluator uses a shell-free invocation, exact output, isolated cwd and case identity", () => {
  const result = evaluate(base(), run("console.log(JSON.stringify({value:process.argv[1]}))"));
  assert.equal(result.passed, true);
  assert.equal(result.counts.passed, 1);
  assert.equal(result.source_unchanged, null);
  assert.match(result.case_sha256, /^[a-f0-9]{64}$/);
  assert.equal(evaluate(base(), run("console.log(JSON.stringify({value:process.argv[1]}))")).case_sha256, result.case_sha256);
});

test("wrong outputs, exits, stderr and modified inputs fail even when the program exits zero", () => {
  const result = evaluate(base(), run("require('fs').writeFileSync('input.txt','changed'); console.log('{}'); console.error('unexpected'); process.exitCode=3"));
  assert.equal(result.passed, false);
  assert.deepEqual(result.results[0].failures, ["EXIT_MISMATCH", "STDERR_MISMATCH", "STDOUT_MISMATCH", "FILE_MISMATCH:input.txt"]);
});

test("unexpected output and byte changes hidden by UTF-8 replacement decoding are failures", () => {
  const suite = base();
  suite.tests[0].files["input.txt"] = "�";
  const result = evaluate(suite, run("const fs=require('fs'); fs.writeFileSync('input.txt',Buffer.from([255])); fs.mkdirSync('extra'); console.log(JSON.stringify({value:process.argv[1]}))"));
  assert.equal(result.passed, false);
  assert.deepEqual(result.results[0].failures, ["FILE_MISMATCH:input.txt", "UNEXPECTED_PATH:extra"]);
});

test("invalid UTF-8 output cannot pass by decoding to the expected replacement character", () => {
  const suite = base();
  suite.tests[0].expect = { exit: 0, stdout: "�", stderr: "" };
  assert.equal(evaluate(suite, run("process.stdout.write(Buffer.from([255]))")).passed, false);
});

test("stdin and explicit output files are checked, while each test starts fresh", () => {
  const suite = base();
  suite.tests = [1, 2].map(n => ({ id: String(n), args: [], stdin: "sample", files: { "nested/data": "old" }, expect: { exit: 0, stdout: "sample", stderr: "", files: { "nested/data": "new", "created": "yes" } } }));
  assert.equal(evaluate(suite, run("const fs=require('fs'); if(fs.existsSync('created'))process.exit(9); fs.writeFileSync('nested/data','new'); fs.writeFileSync('created','yes'); process.stdout.write(fs.readFileSync(0))")).passed, true);
});

test("timed-out processes fail and temporary directories are removed after success and failure", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-evaluator-test-"));
  try {
    const marker = path.join(directory, "cwd.txt");
    const suite = base();
    suite.timeout_ms = 250;
    const code = `require('fs').writeFileSync(${JSON.stringify(marker)},process.cwd()); setInterval(()=>{},1000)`;
    const result = evaluate(suite, run(code));
    assert.equal(result.passed, false);
    assert.ok(result.results[0].failures.includes("TIMEOUT"));
    assert.equal(fs.existsSync(fs.readFileSync(marker, "utf8")), false);
    assert.throws(() => evaluate(base(), [path.join(directory, "absent-executable")]), /Executable not found/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("invalid manifests are rejected before any execution, including unknown fields and path traversal", () => {
  const mutations = [
    s => { s.schema_version = 2; }, s => { s.command = "anything"; }, s => { s.timeout_ms = 0; },
    s => { s.tests = []; }, s => { s.tests.push(s.tests[0]); }, s => { s.tests[0].args = "command"; },
    s => { s.tests[0].files = { "../outside": "x" }; }, s => { s.tests[0].files = { "C:\\outside": "x" }; },
    s => { s.tests[0].files = { "/absolute": "x" }; }, s => { s.tests[0].expect.stdout = ""; },
    s => { delete s.tests[0].expect.stderr; }, s => { s.tests[0].expect.files = { "../outside": "x" }; },
    s => { s.tests[0].expect.exit = null; }, s => { s.tests[0].files = null; },
    s => { s.tests[0].files = { "a": "file", "a/b": "nested" }; },
    s => { s.tests[0].files = { "NUL.txt": "x" }; }, s => { s.tests[0].files = { "ambiguous.": "x" }; },
    s => { s.tests[0].files = { "A": "x", "a": "y" }; },
    s => { s.tests[0].files = { "Dir/a": "x", "dir/b": "y" }; },
  ];
  for (const mutate of mutations) { const suite = base(); mutate(suite); assert.throws(() => validateCase(suite)); }
});

test("CLI distinguishes failed behavior from invalid input and emits parseable JSON", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-eval-cli-"));
  const cli = fileURLToPath(new URL("../scripts/prd.mjs", import.meta.url));
  try {
    const suitePath = path.join(directory, "case.json");
    fs.writeFileSync(suitePath, JSON.stringify(base()));
    const invoke = args => spawnSync(process.execPath, [cli, "evaluate", ...args], { encoding: "utf8" });
    const failed = invoke([suitePath, "--json", "--", ...run("console.log('{}')")]);
    assert.equal(failed.status, 1, failed.stderr);
    assert.equal(JSON.parse(failed.stdout).passed, false);
    assert.equal(invoke([suitePath, "--wrong", "--", ...run("")]).status, 2);
    assert.equal(invoke([suitePath]).status, 2);
    assert.equal(invoke([suitePath, "--"]).status, 2);
    fs.writeFileSync(suitePath, Buffer.from([0xff]));
    assert.equal(invoke([suitePath, "--", ...run("")]).status, 2);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("a self-modifying entry cannot reuse its original source identity as passing evidence", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-eval-source-"));
  try {
    const entry = path.join(directory, "candidate.cjs");
    fs.writeFileSync(entry, "require('fs').appendFileSync(__filename,'\\n// modified'); console.log(JSON.stringify({value:process.argv[2]}));");
    const report = evaluate(base(), [process.execPath, entry]);
    assert.equal(report.counts.passed, 1);
    assert.equal(report.passed, false);
    assert.equal(report.source_unchanged, false);
    assert.deepEqual(report.findings, ["ENTRY_SOURCE_CHANGED"]);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("output flooding is bounded and cannot produce a passing result", () => {
  const report = evaluate(base(), run("process.stdout.write('x'.repeat(2*1024*1024))"));
  assert.equal(report.passed, false);
  assert.ok(report.results[0].failures.includes("PROCESS_ERROR"));
});
