import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateToolkit, validateVersionContract } from "../scripts/validate-toolkit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("complete toolkit structural validation and generator regressions pass", () => {
  const result = validateToolkit(ROOT);
  assert.equal(result.valid, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.version, "3.2.0");
  assert.equal(result.counts.findings, 0);
  assert.equal(result.counts.regression_cases, 12);
  assert.equal(result.counts.regression_passed, 12);
  assert.equal(result.counts.regression_failed, 0);
  assert.equal(result.counts.generator_quality_gates, 25);
  assert.equal(result.counts.failure_classifications, 15);
  assert.equal(result.counts.reasonix_commands, 7);
  assert.equal(result.counts.lifecycle_operations, 2);
  assert.equal(result.counts.archived_documents, 0);
  assert.equal(result.counts.synthesis_sections, 14);
  assert.match(result.source_state, /^manifest-sha256:[a-f0-9]{64}$/);
});

test("regression manifest covers Full, Lite, and deterministic negative cases", () => {
  const result = validateToolkit(ROOT);
  const cases = new Map(result.regressions.cases.map((entry) => [entry.id, entry]));
  assert.equal(cases.get("full-stateful-application").observed_valid, true);
  assert.equal(cases.get("lite-ai-automation").observed_valid, true);
  assert.equal(cases.get("reject-milestone-state-contradiction").observed_valid, false);
  assert.ok(cases.get("reject-one-way-requirement-link").finding_codes.includes("TRACE_PAIR_MISMATCH"));
  assert.ok(cases.get("reject-orphaned-traceability").finding_codes.includes("TRACE_REQUIREMENT_COVERAGE"));
  assert.ok(cases.get("reject-unresolved-generator-placeholder").finding_codes.includes("CONTENT_PLACEHOLDER"));
  assert.ok(cases.get("reject-wrong-lite-section-number").finding_codes.includes("STRUCT_SECTION_ORDER"));
  assert.ok(cases.get("reject-misplaced-builder-routing").finding_codes.includes("BUILDER_ROUTING_LOCATION"));
  assert.ok(cases.get("reject-commented-builder-routing").finding_codes.includes("BUILDER_ROUTING_MISSING"));
  assert.ok(cases.get("reject-placeholder-builder-routing").finding_codes.includes("BUILDER_ROUTING_UNRESOLVED"));
  assert.equal(cases.get("legacy-local-build-authority").observed_valid, true);
  assert.ok(cases.get("reject-missing-embedded-builder-entry").finding_codes.includes("FM_AI_INSTRUCTIONS_TARGET"));
  assert.ok([...cases.values()].every((entry) => entry.passed));
});

test("toolkit validation is deterministic for one unchanged source state", () => {
  const first = validateToolkit(ROOT);
  const second = validateToolkit(ROOT);
  assert.equal(first.source_state, second.source_state);
  assert.deepEqual(first.counts, second.counts);
  assert.deepEqual(first.regressions, second.regressions);
  assert.deepEqual(first.findings, second.findings);
});

test("version baseline rejects package, baseline, and changelog drift", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const baseline = fs.readFileSync(path.join(ROOT, "BASELINE.md"), "utf8");
  const changelog = fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8");
  assert.deepEqual(validateVersionContract(packageJson, baseline, changelog), []);

  const drifted = { ...packageJson, version: "9.9.9", private: false };
  const codes = new Set(validateVersionContract(drifted, baseline, changelog).map((finding) => finding.code));
  assert.ok(codes.has("VERSION_PRIVATE"));
  assert.ok(codes.has("VERSION_BASELINE_MISMATCH"));
  assert.ok(codes.has("VERSION_CHANGELOG_MISMATCH"));
});

test("toolkit CLI emits machine-readable evidence and rejects unknown options", () => {
  const valid = spawnSync(process.execPath, ["scripts/validate-toolkit.mjs", "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr);
  const payload = JSON.parse(valid.stdout);
  assert.equal(payload.valid, true);
  assert.equal(payload.regressions.failed, 0);
  assert.equal(payload.readiness_claim, "Level 1 — Unit verified structural contracts only");

  const usage = spawnSync(process.execPath, ["scripts/validate-toolkit.mjs", "--unknown"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /Usage:/);
});

test("toolkit validation rejects template routing hidden in comments", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd-template-routing-"));
  try {
    fs.mkdirSync(path.join(temporary, "templates"));
    const source = fs.readFileSync(path.join(ROOT, "templates/lite.md"), "utf8");
    const start = source.indexOf("### Builder Capability Routing Contract");
    const end = source.indexOf("### Data Contracts", start);
    const block = source.slice(start, end);
    fs.writeFileSync(path.join(temporary, "templates/lite.md"), source.replace(block, `<!--\n${block}\n-->\n`));
    const result = validateToolkit(temporary);
    assert.ok(result.findings.some((entry) => entry.code === "BUILDER_ROUTING_TEMPLATE_POLICY"));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("an incomplete toolkit reports findings instead of crashing", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd-toolkit-validator-"));
  fs.mkdirSync(path.join(temporary, "docs/archive/2026"), { recursive: true });
  fs.writeFileSync(path.join(temporary, "README.md"), "# PRD Generator System\n\n/tmp/prd-toolkit-unzipped/PRD.md\n\nBearer fixture_token_value_1234567890\n");
  fs.writeFileSync(path.join(temporary, "docs/archive/2026/legacy.md"), "# Legacy document without archive metadata\n");
  const result = validateToolkit(temporary);
  assert.equal(result.valid, false);
  assert.ok(result.findings.some((finding) => finding.code === "CANONICAL_FILE_MISSING"));
  assert.ok(result.findings.some((finding) => finding.code === "DOC_LEGACY_NAME"));
  assert.ok(result.findings.some((finding) => finding.code === "DOC_PROVENANCE_OWNERSHIP"));
  assert.ok(result.findings.some((finding) => finding.code === "MD_SECRET_EXPOSED"));
  assert.ok(result.findings.some((finding) => finding.code === "ARCHIVE_FM_MISSING"));
  assert.ok(result.findings.some((finding) => finding.code === "ARCHIVE_METADATA_KEYS"));
  fs.rmSync(temporary, { recursive: true, force: true });
});

test("authority schema cannot make legacy metadata invalid or silently accept unknown versions", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd-authority-schema-"));
  try {
    fs.mkdirSync(path.join(temporary, "schemas"));
    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas/prd-frontmatter.schema.json"), "utf8"));
    for (const mutation of [
      { ...schema, required: [...schema.required, "authority_policy"] },
      { ...schema, properties: { ...schema.properties, authority_policy: { type: "integer", enum: [1, 2] } } },
    ]) {
      fs.writeFileSync(path.join(temporary, "schemas/prd-frontmatter.schema.json"), JSON.stringify(mutation));
      assert.ok(validateToolkit(temporary).findings.some((f) => f.code === "AUTHORITY_SCHEMA_CONTRACT"));
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
