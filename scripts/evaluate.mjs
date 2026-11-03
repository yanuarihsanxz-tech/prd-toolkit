#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const HELP = `Usage: node scripts/evaluate.mjs <case.json> [--json] -- <executable> [arguments]

Run a trusted implementation against fixed behavioral cases. Commands are supplied
on the command line, never by the case file, and are launched without a shell.
Use absolute paths for program arguments: each case runs in a fresh temp directory.
The report records case/entry-file hashes, exact invocation, results and duration.
Temporary directories are removed; they are NOT a security sandbox.
Exit 0: every case passed; 1: behavioral failure; 2: invalid input/invocation.
This proves only these cases for this command, not general model/product quality.`;

function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function keys(value, allowed, label) {
  if (!object(value)) throw new Error(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}`);
}
function fixturePath(name) {
  if (typeof name !== "string" || !name || /[\x00-\x1f\\<>:"|?*]/.test(name) || path.posix.isAbsolute(name) || name.split("/").some(part => !part || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("Fixture paths must be portable relative POSIX paths without traversal or reserved names");
}
function fileMap(value, label) {
  keys(value, Object.keys(value ?? {}), label);
  for (const [name, content] of Object.entries(value)) {
    fixturePath(name);
    if (typeof content !== "string" || Buffer.byteLength(content) > 1024 * 1024) throw new Error(`${label} values must be UTF-8 strings up to 1 MiB`);
  }
}

function checkFileParents(files) {
  const portablePaths = new Map();
  for (const name of Object.keys(files)) {
    const parts = name.split("/");
    for (let i = 1; i < parts.length; i++) if (Object.hasOwn(files, parts.slice(0, i).join("/"))) throw new Error("Fixture file paths cannot also be parent directories");
    for (let i = 1; i <= parts.length; i++) {
      const segment = parts.slice(0, i).join("/");
      const normalized = segment.normalize("NFC").toLowerCase();
      if (portablePaths.has(normalized) && portablePaths.get(normalized) !== segment) throw new Error("Fixture paths collide on case-insensitive or normalization-insensitive filesystems");
      portablePaths.set(normalized, segment);
    }
  }
}

function pathsIn(directory, prefix = "") {
  const entries = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    entries.push(name);
    if (entry.isDirectory()) entries.push(...pathsIn(path.join(directory, entry.name), `${name}/`));
  }
  return entries;
}

export function validateCase(suite) {
  keys(suite, ["schema_version", "id", "description", "timeout_ms", "tests"], "case");
  if (suite.schema_version !== 1 || typeof suite.id !== "string" || !suite.id.trim() || typeof suite.description !== "string" || !suite.description.trim()) throw new Error("Case requires schema_version 1, id and description");
  if (!Number.isInteger(suite.timeout_ms) || suite.timeout_ms < 1 || suite.timeout_ms > 30000) throw new Error("timeout_ms must be an integer from 1 to 30000");
  if (!Array.isArray(suite.tests) || !suite.tests.length || suite.tests.length > 100) throw new Error("Case requires 1–100 tests");
  const ids = new Set();
  for (const item of suite.tests) {
    keys(item, ["id", "args", "stdin", "files", "expect"], "test");
    if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) throw new Error("Test IDs must be nonempty and unique");
    ids.add(item.id);
    if (!Array.isArray(item.args) || item.args.some(a => typeof a !== "string" || a.includes("\0"))) throw new Error("Test args must be an array of strings without NUL");
    if (item.stdin !== undefined && typeof item.stdin !== "string") throw new Error("Test stdin must be a string");
    fileMap(item.files, "files");
    keys(item.expect, ["exit", "stdout", "json", "stderr", "files"], "expect");
    if (!Number.isInteger(item.expect.exit) || item.expect.exit < 0 || item.expect.exit > 255) throw new Error("Expected exit must be an integer from 0 to 255");
    if (Object.hasOwn(item.expect, "stdout") === Object.hasOwn(item.expect, "json")) throw new Error("Specify exactly one of expect.stdout or expect.json");
    if (Object.hasOwn(item.expect, "stdout") && typeof item.expect.stdout !== "string") throw new Error("Expected stdout must be a string");
    if (typeof item.expect.stderr !== "string") throw new Error("Expected stderr must be an exact string");
    if (item.expect.files !== undefined) fileMap(item.expect.files, "expected files");
    checkFileParents({ ...item.files, ...item.expect.files });
  }
  return suite;
}

export function evaluate(suite, command, { caseHash = hash(JSON.stringify(suite)) } = {}) {
  validateCase(suite);
  if (!Array.isArray(command) || !command.length || command.some(a => typeof a !== "string" || a.includes("\0")) || !command[0]) throw new Error("Supply a trusted executable after --");
  // Resolve only the executable before changing cwd; callers supply absolute entry paths.
  const invocation = [...command];
  if (invocation[0].includes("/") || invocation[0].includes("\\")) invocation[0] = path.resolve(invocation[0]);
  const sources = [];
  for (const arg of invocation.slice(1)) {
    if (path.isAbsolute(arg) && fs.existsSync(arg) && fs.statSync(arg).isFile()) sources.push({ path: arg, sha256: hash(fs.readFileSync(arg)) });
  }
  const results = [];
  for (const item of suite.tests) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-eval-"));
    const failures = [];
    const started = performance.now();
    try {
      for (const [name, content] of Object.entries(item.files)) {
        const target = path.join(directory, name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, { flag: "wx" });
      }
      const result = spawnSync(invocation[0], [...invocation.slice(1), ...item.args], {
        cwd: directory, input: item.stdin ?? "", timeout: suite.timeout_ms,
        killSignal: "SIGKILL", maxBuffer: 1024 * 1024, shell: false,
      });
      if (["ENOENT", "EACCES", "ENOEXEC", "ENOTDIR"].includes(result.error?.code)) throw new Error(`Executable not found or not executable: ${invocation[0]}`);
      if (result.error) failures.push(result.error.code === "ETIMEDOUT" ? "TIMEOUT" : "PROCESS_ERROR");
      if (result.signal && !result.error) failures.push("PROCESS_SIGNAL");
      if (result.status !== item.expect.exit) failures.push("EXIT_MISMATCH");
      if (!Buffer.isBuffer(result.stderr) || !result.stderr.equals(Buffer.from(item.expect.stderr, "utf8"))) failures.push("STDERR_MISMATCH");
      try {
        if (Object.hasOwn(item.expect, "json")) assert.deepEqual(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(result.stdout)), item.expect.json);
        else assert.deepEqual(result.stdout, Buffer.from(item.expect.stdout, "utf8"));
      } catch { failures.push("STDOUT_MISMATCH"); }
      // Inputs must remain byte-identical unless a new value is explicitly expected.
      const expectedFiles = { ...item.files, ...item.expect.files };
      const allowedPaths = new Set();
      for (const [name, content] of Object.entries(expectedFiles)) {
        let target = directory;
        try {
          const parts = name.split("/");
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            target = path.join(target, part);
            allowedPaths.add(parts.slice(0, i + 1).join("/"));
            const stat = fs.lstatSync(target);
            if (stat.isSymbolicLink() || (i === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) throw new Error("Unexpected file type");
          }
          assert.deepEqual(fs.readFileSync(target), Buffer.from(content, "utf8"));
        } catch { failures.push(`FILE_MISMATCH:${name}`); }
      }
      try {
        for (const name of pathsIn(directory)) if (!allowedPaths.has(name)) failures.push(`UNEXPECTED_PATH:${name}`);
      } catch { failures.push("OUTPUT_INSPECTION_FAILED"); }
      results.push({ id: item.id, passed: failures.length === 0, failures, exit: result.status, signal: result.signal, duration_ms: Math.round(performance.now() - started) });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
  const sourceUnchanged = sources.every(source => {
    try { return hash(fs.readFileSync(source.path)) === source.sha256; }
    catch { return false; }
  });
  return {
    schema_version: 1, case_id: suite.id, case_sha256: caseHash, command: invocation, entry_files: sources,
    environment: { platform: process.platform, arch: process.arch, evaluator_node: process.version },
    passed: sourceUnchanged && results.every(r => r.passed), source_unchanged: sources.length ? sourceUnchanged : null,
    findings: sourceUnchanged ? [] : ["ENTRY_SOURCE_CHANGED"],
    counts: { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length }, results,
    limitations: ["Only the declared behavioral cases were checked; no semantic or general model-quality score.", "Entry-file hashes do not cover transitive imports or external services.", "The supplied program executes with your permissions. A temporary working directory is not a sandbox; programs must terminate their own descendants."],
  };
}

export function runCli(args = process.argv.slice(2)) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) { console.log(HELP); return 0; }
  try {
    const separator = args.indexOf("--");
    const before = args.slice(0, separator);
    if (separator < 1 || before.length > 2 || (before.length === 2 && before[1] !== "--json") || before[0].startsWith("--")) throw new Error(HELP);
    const file = path.resolve(before[0]);
    if (!fs.statSync(file).isFile() || fs.statSync(file).size > 2 * 1024 * 1024) throw new Error("Case must be a file up to 2 MiB");
    const bytes = fs.readFileSync(file);
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const report = evaluate(JSON.parse(source), args.slice(separator + 1), { caseHash: hash(bytes) });
    if (before.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`${report.passed ? "PASS" : "FAIL"} ${report.case_id}: ${report.counts.passed}/${report.counts.total} cases`);
      for (const result of report.results) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.id}${result.failures.length ? `: ${result.failures.join(", ")}` : ""}`);
      for (const finding of report.findings) console.log(`FAIL ${finding}`);
      console.log(`Case SHA-256: ${report.case_sha256}. Only these behavioral cases are proven.`);
    }
    return report.passed ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    return 2;
  }
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runCli();
