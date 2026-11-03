import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { contextPacket } from "../scripts/prd.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "scripts/prd.mjs");
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: os.tmpdir(), encoding: "utf8" });

test("one CLI preserves validation, preview, comparison and invalid-input exit contracts from another cwd", () => {
  const example = path.join(root, "examples/tool-prd-example.md");
  const checked = run("validate", example, "--json");
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).valid, true);
  assert.equal(run("validate", "missing-file.md").status, 2);
  const compared = run("compare", example, example, "--json");
  assert.equal(compared.status, 0, compared.stderr);
  assert.equal(JSON.parse(compared.stdout).counts.modified, 0);
  assert.match(run("preview", example).stdout, /```mermaid/);
  assert.equal(run("--version").stdout.trim(), JSON.parse(fs.readFileSync(path.join(root, "package.json"))).version);
  for (const args of [["contex"], ["context", "nope"], ["context", "generate", "--type"], ["context", "generate", "--out"], ["context", "generate", "--type", "api"], ["context", "generate", "--out", "--change"], ["context", "generate", "--change", "--change"], ["context", "generate", "--shell"]]) assert.equal(run(...args).status, 2, args.join(" "));
});

test("portable packets select only the requested operation and preserve exact canonical sources", () => {
  const packet = contextPacket("generate", { type: "tool" });
  assert.ok(packet.files.includes("templates/lite.md"));
  assert.ok(!packet.files.includes("templates/full.md"));
  assert.ok(!packet.files.includes("layout/EXECUTE_TASKS.md"));
  assert.ok(!packet.files.includes("prompts/PHASE_GATED_TASK_RUNNER.md"));
  assert.ok(!packet.files.includes("prompts/RELIABILITY_GUIDE.md"));
  assert.match(packet.markdown, /UNVERIFIED/);
  for (const file of packet.files) assert.ok(packet.markdown.includes(fs.readFileSync(path.join(root, file), "utf8").trimEnd()), file);
  assert.deepEqual(contextPacket("generate", { type: "tool" }), packet);
  const both = contextPacket("generate");
  assert.ok(both.files.includes("templates/full.md") && both.files.includes("templates/lite.md"));
  assert.ok(contextPacket("improve").files.includes("docs/CHANGE_CONTRACT.md"));
  assert.ok(contextPacket("generate", { change: true }).files.includes("docs/CHANGE_CONTRACT.md"));
  assert.ok(contextPacket("generate", { reliability: true }).files.includes("prompts/RELIABILITY_GUIDE.md"));
  for (const operation of ["discover", "review", "build", "audit"]) {
    const files = contextPacket(operation).files;
    assert.equal(files.filter(f => f.startsWith("layout/")).length, 1);
    assert.ok(!files.includes("prompts/PRD_GENERATOR_PROMPT.md"));
  }
});

test("saving a packet refuses existing files and symlinks without changing their contents", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd packet "));
  try {
    const output = path.join(directory, "packet with spaces.md");
    assert.equal(run("context", "generate", "--type", "tool", "--out", output).status, 0);
    const original = fs.readFileSync(output);
    assert.equal(run("context", "generate", "--out", output).status, 2);
    assert.deepEqual(fs.readFileSync(output), original);
    const link = path.join(directory, "alias.md");
    // Windows CI cannot create file symlinks without elevated developer mode.
    if (process.platform !== "win32") {
      fs.symlinkSync(output, link);
      assert.equal(run("context", "generate", "--out", link).status, 2);
      assert.deepEqual(fs.readFileSync(output), original);
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
