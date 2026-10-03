import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { comparePrd, extractRequirements } from "../scripts/compare-prd.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
test("comparison covers typed ACs and combined FR/NFR rows in the actual templates", () => {
  for (const [name, count] of [["full", 11], ["lite", 7]]) {
    const source = fs.readFileSync(path.join(root, `templates/${name}.md`), "utf8");
    const parsed = extractRequirements(source);
    assert.deepEqual(parsed.diagnostics, [], name);
    assert.equal(parsed.entries.size, count, name);
    assert.ok(parsed.entries.has("AC-001"));
    assert.ok(parsed.entries.has("NFR-001"));
    const changed = comparePrd(source, source.replace("| Positive |", "| Boundary |"));
    assert.deepEqual(changed.modified[0].changedFields.map((f) => f.field), ["type"]);
  }
});

test("malformed retirement IDs and unclosed frontmatter never produce valid comparison", () => {
  for (const id of ["", "oops", "FR-1"]) {
    const source = `- FR-002: Preserve remaining behavior.\n\n| ID | Status | Note |\n| --- | --- | --- |\n| ${id} | removed | Retired. |\n`;
    const result = comparePrd(source, source);
    assert.equal(result.valid, false);
    assert.ok(result.diagnostics.some((d) => d.code === "CHANGE_ROW_INVALID"));
  }
  const source = "---\nproject: broken\n- FR-001: This is ambiguous unclosed metadata.\n";
  assert.equal(comparePrd(source, source).valid, false);
});
test("retirement history survives later revisions and reactivation remains distinct", () => {
  const active = "- FR-002: Export records without changing their order.\n";
  const history = "\n| ID | Status | Note |\n| --- | --- | --- |\n| FR-001 | retired | Old import behavior retired in version 1.1.0. |\n";
  assert.deepEqual(comparePrd(active + history, active + history).findings.retirementHistoryDropped, []);
  assert.deepEqual(comparePrd(active + history, active).findings.retirementHistoryDropped, ["FR-001"]);
  const reuse = comparePrd(active + history, active + "- FR-001: Send notifications to recipients.\n");
  assert.deepEqual(reuse.findings.retiredIdReactivated, ["FR-001"]);
  assert.deepEqual(reuse.findings.retirementHistoryDropped, []);
});
test("actual Full and Lite examples retain complete comparison coverage", () => {
  for (const [file, count] of [["app", 40], ["tool", 27]]) {
    const source = fs.readFileSync(path.join(root, `examples/${file}-prd-example.md`), "utf8");
    assert.equal(extractRequirements(source).entries.size, count);
    const same = comparePrd(source, source);
    assert.deepEqual(same.diagnostics, []);
    assert.equal(same.counts.unchanged, count);
    const changed = source.replace(/(\| AC-001 \|[^\n]+\|)([^|\n]+)\|/, "$1 Re-run the original reproducer and assert preserved state. |");
    assert.notEqual(changed, source);
    const result = comparePrd(source, changed);
    assert.equal(result.valid, true);
    assert.equal(result.modified.length, 1);
    assert.equal(result.modified[0].id, "AC-001");
    assert.deepEqual(result.modified[0].changedFields.map((f) => f.field), ["requiredEvidence"]);
    assert.equal(result.counts.unchanged, count - 1);
  }
});

test("comparison CLI works through a symlinked toolkit folder from another cwd", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd compare alias "));
  try {
    const alias = path.join(temporary, "prd-maker");
    fs.symlinkSync(root, alias, "junction");
    const input = path.join(alias, "examples/tool-prd-example.md");
    const result = spawnSync(process.execPath, [path.join(alias, "scripts/compare-prd.mjs"), input, input, "--json"], { cwd: temporary, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).counts.unchanged, 27);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
