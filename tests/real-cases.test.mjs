import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { evaluate } from "../scripts/evaluate.mjs";
import { validatePrd } from "../scripts/validate-prd.mjs";

const root = fileURLToPath(new URL("../evals/real-cases/", import.meta.url));
const load = name => JSON.parse(fs.readFileSync(path.join(root, name, "case.json"), "utf8"));

test("new CLI is runnable from its retained PRD and passes independent file/output cases", () => {
  assert.equal(validatePrd(fs.readFileSync(path.join(root, "line-summary/PRD.md"), "utf8")).valid, true);
  const report = evaluate(load("line-summary"), [process.execPath, path.join(root, "line-summary/candidate.mjs")]);
  assert.equal(report.passed, true, JSON.stringify(report.results.filter(r => !r.passed)));
});

test("fixed CSV oracle catches the preserved defect and qualifies the repair without changing the oracle", () => {
  const suite = load("csv-total");
  const before = evaluate(suite, [process.execPath, path.join(root, "csv-total/before.mjs")]);
  const after = evaluate(suite, [process.execPath, path.join(root, "csv-total/candidate.mjs")]);
  assert.equal(before.passed, false);
  assert.ok(before.results.some(r => r.id === "quoted-comma" && !r.passed));
  assert.ok(before.results.some(r => r.id === "large-exact-amount" && !r.passed));
  assert.ok(before.results.some(r => r.id === "ordinary-export" && r.passed));
  assert.equal(before.case_sha256, after.case_sha256);
  assert.equal(after.passed, true, JSON.stringify(after.results.filter(r => !r.passed)));
  assert.equal(validatePrd(fs.readFileSync(path.join(root, "csv-total/PRD.md"), "utf8")).valid, true);
});

test("both real commands reject invalid UTF-8 and directory inputs without rewriting source bytes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-real-input-"));
  try {
    const file = path.join(directory, "invalid.txt");
    const original = Buffer.from([0xff, 0xfe]);
    fs.writeFileSync(file, original);
    for (const name of ["line-summary", "csv-total"]) {
      for (const input of [file, directory]) {
        const result = spawnSync(process.execPath, [path.join(root, name, "candidate.mjs"), input], { encoding: "utf8", timeout: 3000 });
        assert.equal(result.status, 1, name);
        assert.equal(result.stdout, "");
        assert.equal(result.stderr, "Cannot read input\n");
        assert.deepEqual(fs.readFileSync(file), original);
      }
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("CSV repair handles additional independent decimal and parser boundaries", () => {
  const valid = [
    ["item,amount\nA,-2\nB,0.5", { rows: 2, total: "-1.50" }],
    ['"item","amount"\n"",2.00', { rows: 1, total: "2.00" }],
    ["item,amount", { rows: 0, total: "0.00" }],
    ["item,amount\nA,-0.00", { rows: 1, total: "0.00" }],
  ];
  const invalid = ["", "item,amount\nA,2e3", "item,amount\nA, 2", "item,amount\nA,+2", "item,amount\nA,2.", 'item,amount\nA"B,2', 'item,amount\n"A"x,2', "item,amount\nA", "item,amount\rA,2", "item,amount\n\n"];
  const suite = { schema_version: 1, id: "csv-boundaries", description: "Additional fixed parser/decimal boundaries", timeout_ms: 3000, tests: [
    ...valid.map(([content, json], i) => ({ id: `valid-${i}`, args: ["input.csv"], files: { "input.csv": content }, expect: { exit: 0, json, stderr: "" } })),
    ...invalid.map((content, i) => ({ id: `invalid-${i}`, args: ["input.csv"], files: { "input.csv": content }, expect: { exit: 1, stdout: "", stderr: "Invalid CSV\n" } })),
  ] };
  const report = evaluate(suite, [process.execPath, path.join(root, "csv-total/candidate.mjs")]);
  assert.equal(report.passed, true, JSON.stringify(report.results.filter(r => !r.passed)));
});
