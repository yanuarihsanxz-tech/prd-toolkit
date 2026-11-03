import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { exportToolkit, verifyDistribution } from "../scripts/export-toolkit.mjs";
import { CANONICAL_PATHS, validateToolkit } from "../scripts/validate-toolkit.mjs";
import { testFiles } from "../scripts/run-tests.mjs";

test("CLI modules can be imported from standard input without executing or resolving '-'", () => {
  const modules = ["prd", "evaluate", "run-tests", "compare-prd", "validate-prd", "validate-toolkit", "preview-prd", "export-toolkit", "local-task-runner"];
  const input = modules.map((name) => `import ${JSON.stringify(new URL(`../scripts/${name}.mjs`, import.meta.url).href)};`).join("\n");
  const imported = spawnSync(process.execPath, ["--input-type=module", "-"], {
    input, cwd: os.tmpdir(), encoding: "utf8",
  });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, "");
  assert.equal(imported.stderr, "");
});

test("test discovery ignores archived/exported copies and uses only explicit toolkit test files", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd-tests-"));
  try {
    fs.mkdirSync(path.join(temporary, "tests"));
    fs.mkdirSync(path.join(temporary, "runs/export/tests"), { recursive: true });
    fs.writeFileSync(path.join(temporary, "tests/real.test.mjs"), "");
    fs.writeFileSync(path.join(temporary, "tests/helper.mjs"), "");
    fs.writeFileSync(path.join(temporary, "runs/export/tests/duplicate.test.mjs"), "");
    assert.deepEqual(testFiles(temporary), [path.join(temporary, "tests/real.test.mjs")]);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test("clean export works from another cwd, preserves identity, excludes local data, and refuses overwrite", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd distribution "));
  try {
    const target = path.join(temporary, "checkout with spaces");
    const receipt = exportToolkit(target);
    assert.equal(receipt.files, CANONICAL_PATHS.length);
    assert.equal(validateToolkit(target).source_state, receipt.source_state);
    assert.equal(verifyDistribution(target).verified, true);
    const manifest = JSON.parse(fs.readFileSync(path.join(target, "DISTRIBUTION.json"), "utf8"));
    assert.equal(manifest.files.length, CANONICAL_PATHS.length);
    assert.deepEqual(manifest.files.map((f) => f.path), [...CANONICAL_PATHS].sort());
    for (const excluded of ["runs", "node_modules", ".git", ".env", ".prd"]) {
      assert.equal(fs.existsSync(path.join(target, excluded)), false);
    }
    for (const example of ["app-prd-example.md", "tool-prd-example.md"]) {
      const run = spawnSync(process.execPath, [path.join(target, "scripts/validate-prd.mjs"), path.join(target, "examples", example), "--json"], { cwd: temporary, encoding: "utf8" });
      assert.equal(run.status, 0, run.stdout + run.stderr);
      assert.equal(JSON.parse(run.stdout).valid, true);
      const preview = spawnSync(process.execPath, [path.join(target, "scripts/preview-prd.mjs"), path.join(target, "examples", example)], { cwd: temporary, encoding: "utf8" });
      assert.equal(preview.status, 0, preview.stderr);
      assert.match(preview.stdout, /```mermaid/);
      const comparison = spawnSync(process.execPath, [path.join(target, "scripts/compare-prd.mjs"), path.join(target, "examples", example), path.join(target, "examples", example), "--json"], { cwd: temporary, encoding: "utf8" });
      assert.equal(comparison.status, 0, comparison.stderr);
      assert.equal(JSON.parse(comparison.stdout).valid, true);
    }
    const packet = spawnSync(process.execPath, [path.join(target, "scripts/prd.mjs"), "context", "generate", "--type", "tool"], { cwd: temporary, encoding: "utf8" });
    assert.equal(packet.status, 0, packet.stderr);
    assert.match(packet.stdout, /# Toolkit source: templates\/lite.md/);
    const packetPath = path.join(temporary, "instructions.md");
    const savedPacket = spawnSync(process.execPath, [path.join(target, "scripts/prd.mjs"), "context", "generate", "--type", "tool", "--out", packetPath], { cwd: temporary, encoding: "utf8" });
    assert.equal(savedPacket.status, 0, savedPacket.stderr);
    assert.equal(verifyDistribution(target).verified, true);
    const evaluated = spawnSync(process.execPath, [path.join(target, "scripts/prd.mjs"), "evaluate", path.join(target, "evals/real-cases/line-summary/case.json"), "--json", "--", process.execPath, path.join(target, "evals/real-cases/line-summary/candidate.mjs")], { cwd: temporary, encoding: "utf8" });
    assert.equal(evaluated.status, 0, evaluated.stderr);
    assert.equal(JSON.parse(evaluated.stdout).passed, true);
    assert.throws(() => exportToolkit(target), /already exists/);
    const installation = path.join(temporary, "project", ".agents", "skills", "prd-maker");
    exportToolkit(installation);
    assert.equal(verifyDistribution(installation).source_state, receipt.source_state);
    assert.equal(fs.readFileSync(path.join(installation, "DISTRIBUTION.json"), "utf8"), fs.readFileSync(path.join(target, "DISTRIBUTION.json"), "utf8"));
    const extraFile = path.join(installation, "unexpected.txt");
    fs.writeFileSync(extraFile, "Not part of this distribution");
    assert.throws(() => verifyDistribution(installation), /unexpected files/);
    fs.rmSync(extraFile);
    assert.match(fs.readFileSync(path.join(installation, "SKILL.md"), "utf8"), /name: prd-maker/);
    const verifyCli = spawnSync(process.execPath, [path.join(target, "scripts/export-toolkit.mjs"), "--verify", installation], { cwd: temporary, encoding: "utf8" });
    assert.equal(verifyCli.status, 0, verifyCli.stderr);
    fs.appendFileSync(path.join(installation, "README.md"), "\nChanged after export.\n");
    assert.throws(() => verifyDistribution(installation), /does not match/);
    const alias = path.join(temporary, "checkout alias");
    fs.symlinkSync(target, alias, "junction");
    const aliasedValidator = spawnSync(process.execPath, [path.join(alias, "scripts/validate-toolkit.mjs"), "--json"], { cwd: temporary, encoding: "utf8" });
    assert.equal(aliasedValidator.status, 0, aliasedValidator.stderr);
    assert.equal(JSON.parse(aliasedValidator.stdout).valid, true);
    const runner = spawnSync(process.execPath, [path.join(alias, "scripts/local-task-runner.mjs")], { cwd: temporary, encoding: "utf8" });
    assert.notEqual(runner.status, 0);
    assert.match(runner.stderr, /Usage:/);
    fs.mkdirSync(path.join(target, "runs"));
    fs.writeFileSync(path.join(target, "runs", "local.md"), "```\n[broken](missing.md)\n");
    assert.equal(validateToolkit(target).valid, true);
    fs.appendFileSync(path.join(target, "README.md"), "\nPrivate source: /Users/example-author/private-project/source.md\n");
    assert.ok(validateToolkit(target).findings.some((entry) => entry.code === "PUBLIC_PERSONAL_PATH"));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
