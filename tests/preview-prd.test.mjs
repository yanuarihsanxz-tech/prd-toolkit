import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { previewPrd } from "../scripts/preview-prd.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = fs.readFileSync(path.join(ROOT, "examples/app-prd-example.md"), "utf8");
const TOOL = fs.readFileSync(path.join(ROOT, "examples/tool-prd-example.md"), "utf8");

test("Full and Lite previews reuse the real product diagram without changing the PRD", () => {
  for (const [source, name] of [[APP, "app-prd-example.md"], [TOOL, "tool-prd-example.md"]]) {
    const file = path.join(ROOT, "examples", name);
    const before = fs.readFileSync(file);
    const result = previewPrd(source, file);
    assert.equal(result.valid, true, result.error);
    const diagram = result.markdown.match(/```mermaid\n([\s\S]*?)\n```/)[1];
    assert.ok(source.includes(diagram));
    assert.match(diagram, /-->(?:\|No\||.*failure)/);
    assert.match(result.markdown, /does not prove.*implementation or runtime behavior/);
    assert.deepEqual(fs.readFileSync(file), before);
    assert.equal(result.markdown.match(/```mermaid/g).length, 1);
  }
});

test("preview refuses invalid PRDs and does not invent a missing product flow", () => {
  const invalid = previewPrd(TOOL.replace("FR-001", "FR-broken"));
  assert.equal(invalid.valid, false);
  assert.equal(invalid.markdown, null);
  const sequenceOnly = TOOL.replace(/```mermaid\n[\s\S]*?\n```/, "```mermaid\nsequenceDiagram\n    A->>B: Send input\n```");
  const missing = previewPrd(sequenceOnly);
  assert.equal(missing.validation.valid, true);
  assert.equal(missing.valid, false);
  assert.match(missing.error, /sequence-only PRDs remain valid/);
  const commented = TOOL.replace(/```mermaid\n[\s\S]*?\n```/, (flow) => `<!--\n${flow}\n-->`);
  assert.equal(previewPrd(commented).valid, false);
});

test("CLI works from another cwd with spaces and reports usage, input and validation failures", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd preview "));
  try {
    const file = path.join(temporary, "product brief.md");
    fs.writeFileSync(file, TOOL);
    const command = path.join(ROOT, "scripts/preview-prd.mjs");
    const run = (...args) => spawnSync(process.execPath, [command, ...args], { cwd: temporary, encoding: "utf8" });
    const success = run(file);
    assert.equal(success.status, 0, success.stderr);
    assert.match(success.stdout, /product%20brief.md/);
    assert.equal(run().status, 2);
    assert.equal(run(path.join(temporary, "missing.md")).status, 2);
    fs.writeFileSync(file, "invalid PRD");
    const invalid = run(file);
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("worked handoff keeps its flow identical to the PRD and references existing requirements", () => {
  const example = fs.readFileSync(path.join(ROOT, "examples/prd-handoff-example.md"), "utf8");
  const diagram = example.match(/```mermaid\n([\s\S]*?)\n```/)[1];
  assert.ok(APP.includes(diagram));
  for (const id of example.match(/\b(?:FR|NFR|AC)-\d{3}\b/g) ?? []) assert.ok(APP.includes(`| ${id} |`), id);
});
