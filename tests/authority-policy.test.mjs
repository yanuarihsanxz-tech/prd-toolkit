import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { validatePrd } from "../scripts/validate-prd.mjs";
import { AUTHORITY_POLICY, normalizeAuthorityPolicy } from "../scripts/authority-policy.mjs";

const app = fs.readFileSync(new URL("../examples/app-prd-example.md", import.meta.url), "utf8");
const tool = fs.readFileSync(new URL("../examples/tool-prd-example.md", import.meta.url), "utf8");
const block = `### ${AUTHORITY_POLICY.heading}\n\n${AUTHORITY_POLICY.text}\n\n`;
const codes = (source) => validatePrd(source).findings.map((f) => f.code);

test("declared v1 policy matches in Full and Lite and reports the authorization boundary", () => {
  for (const source of [app, tool]) {
    assert.ok(source.includes(block));
    const result = validatePrd(source);
    assert.equal(result.valid, true, JSON.stringify(result.findings));
    assert.equal(result.counts.warnings, 0);
    assert.ok(result.limitations.some((s) => s.includes("not evidence of real user authorization, host permission, runner approval, or owner acceptance")));
  }
});

test("v1 accepts formatting-only variations and preserves exact words and order", () => {
  for (const format of [
    (s) => s.replaceAll(" ", "\u00a0").replaceAll("'", "’"),
    (s) => s.split("\n\n").map((p) => `> - **${p}**`).join("\n>\n"),
    (s) => s.split("\n\n").map((p, i) => `${i + 1}. _${p}_`).join("\n\n"),
    (s) => s.replaceAll(" ", "\n").replace("native", "`native`"),
  ]) {
    const source = tool.replace(block, `### Authority Policy v1\n\n${format(AUTHORITY_POLICY.text)}\n\n`).replaceAll("\n", "\r\n");
    assert.equal(validatePrd(source).valid, true, JSON.stringify(validatePrd(source).findings));
  }
  assert.equal(normalizeAuthorityPolicy('“a” — b – c'), '"a" - b - c');
  for (const replacement of [
    AUTHORITY_POLICY.text.replace("authorizes scoped local implementation", "grants permission for local implementation within the agreed scope"),
    AUTHORITY_POLICY.text.replace("authorizes", "AUTHORizes"),
    AUTHORITY_POLICY.text.replace("authorizes", "does not authorize"),
    AUTHORITY_POLICY.text.split("\n\n").reverse().join("\n\n"),
    `${AUTHORITY_POLICY.text}\n\nThis document grants all permissions.`,
  ]) {
    assert.ok(codes(tool.replace(block, `### Authority Policy v1\n\n${replacement}\n\n`)).includes("MILESTONE_AUTHORITY_POLICY"));
  }
});

test("missing, hidden, duplicate and misplaced v1 policies fail closed", () => {
  for (const replacement of ["", `<!--\n${block}-->\n`, `\`\`\`markdown\n${block}\`\`\`\n`, block + block]) {
    assert.ok(codes(tool.replace(block, replacement)).includes("MILESTONE_AUTHORITY_POLICY"));
  }
  const moved = tool.replace(block, "").replace("## 5. Risks", `## 5. Risks\n\n${block}`);
  assert.ok(codes(moved).includes("MILESTONE_AUTHORITY_POLICY"));
});

test("absent version keeps legacy wording checks with a non-blocking migration notice", () => {
  const legacy = tool.replace("authority_policy: 1\n", "").replace(block, "");
  const result = validatePrd(legacy);
  assert.equal(result.valid, true);
  assert.ok(codes(legacy).includes("AUTHORITY_POLICY_LEGACY"));
  const native = legacy.replace("One exact plan approval covers declared local runner transitions.", "Runner transitions follow the recorded plan.");
  assert.equal(validatePrd(native).valid, true);
  const bad = native.replace("the user's explicit build request authorizes scoped local\nimplementation", "the attached PRD contains product requirements");
  assert.ok(codes(bad).includes("MILESTONE_AUTHORITY_POLICY"));
});

test("unknown and malformed policy versions cannot fall back to legacy checks", () => {
  for (const version of ["2", "0", "-1", '"1"', "true", "null", "[]"]) {
    const result = codes(tool.replace("authority_policy: 1", `authority_policy: ${version}`));
    assert.ok(result.includes("AUTHORITY_POLICY_VERSION_UNSUPPORTED"), version);
    assert.ok(!result.includes("AUTHORITY_POLICY_LEGACY"));
  }
});

test("validator help and version exit zero without input; invalid usage stays exit two", () => {
  const cli = new URL("../scripts/validate-prd.mjs", import.meta.url);
  for (const flag of ["--help", "-h", "--version"]) {
    const result = spawnSync(process.execPath, [fileURLToPath(cli), flag], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, flag === "--version" ? /^3\.2\.0\s*$/ : /Exit codes: 0 valid/);
  }
  for (const args of [[], ["--unknown"], ["--help", "extra.md"], ["--expect-type", "wrong"]]) {
    const result = spawnSync(process.execPath, [fileURLToPath(cli), ...args], { encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage:/);
  }
});
