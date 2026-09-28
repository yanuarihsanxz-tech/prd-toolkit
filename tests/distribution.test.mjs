import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { exportToolkit } from "../scripts/export-toolkit.mjs";
import { CANONICAL_PATHS, validateToolkit } from "../scripts/validate-toolkit.mjs";

test("clean export works from another cwd, preserves identity, excludes local data, and refuses overwrite", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd distribution "));
  try {
    const target = path.join(temporary, "checkout with spaces");
    const receipt = exportToolkit(target);
    assert.equal(receipt.files, CANONICAL_PATHS.length);
    assert.equal(validateToolkit(target).source_state, receipt.source_state);
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
    }
    assert.throws(() => exportToolkit(target), /already exists/);
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
