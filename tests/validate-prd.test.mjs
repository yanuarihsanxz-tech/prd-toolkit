import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { parseFrontmatter, validatePrd } from "../scripts/validate-prd.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_PATH = path.join(ROOT, "examples/app-prd-example.md");
const TOOL_PATH = path.join(ROOT, "examples/tool-prd-example.md");
const APP = fs.readFileSync(APP_PATH, "utf8");
const TOOL = fs.readFileSync(TOOL_PATH, "utf8");

function codes(result) {
  return new Set(result.findings.map((finding) => finding.code));
}

test("hidden tables cannot supply requirements, acceptance criteria or milestones", () => {
  for (const source of [APP, TOOL]) {
    for (const [pattern, expected] of [
      [/\| ID \| Requirement \|[^\n]*\n(?:\|[^\n]*\n)+/, "AC_UNKNOWN_REQ"],
      [/\| ID \| Requirement IDs \|[^\n]*\n(?:\|[^\n]*\n)+/g, "AC_MISSING"],
      [/\| # \| Milestone \|[^\n]*\n(?:\|[^\n]*\n)+/g, "MILESTONE_TABLE_MISSING"],
    ]) {
      for (const wrap of [(block) => `<!--\n${block}-->\n`, (block) => `\`\`\`markdown\n${block}\`\`\`\n`]) {
        const mutated = source.replace(pattern, wrap);
        assert.notEqual(mutated, source);
        const result = validatePrd(mutated);
        assert.equal(result.valid, false);
        assert.ok(codes(result).has(expected), JSON.stringify(result.findings));
      }
    }
  }
});

test("empty requirement and acceptance content cannot pass through ID coverage", () => {
  const emptyRequirement = TOOL.replace(/(\| FR-001 \|)[^|]+\|/, "$1  |");
  assert.ok(codes(validatePrd(emptyRequirement)).has("REQ_ROW_INCOMPLETE"));
  const emptyCriterion = TOOL.replace(/(\| AC-001 \| FR-001 \|)[^|]+\|/, "$1  |");
  assert.ok(codes(validatePrd(emptyCriterion)).has("AC_ROW_INCOMPLETE"));
});

test("canonical Full and Lite examples pass with exact structural counts", () => {
  const app = validatePrd(APP, { expectedType: "app", file: APP_PATH });
  const tool = validatePrd(TOOL, { expectedType: "tool", file: TOOL_PATH });

  assert.equal(app.valid, true);
  assert.deepEqual(app.counts, {
    sections: 10,
    requirements: 11,
    acceptance_criteria: 29,
    traceability_rows: 6,
    mermaid_diagrams: 5,
    local_links: 0,
    milestones: 3,
    blockers: 0,
    errors: 0,
    warnings: 0,
  });
  assert.equal(tool.valid, true);
  assert.deepEqual(tool.counts, {
    sections: 6,
    requirements: 14,
    acceptance_criteria: 13,
    traceability_rows: 9,
    mermaid_diagrams: 1,
    local_links: 0,
    milestones: 3,
    blockers: 0,
    errors: 0,
    warnings: 0,
  });
});

test("compact template handoff validates in Full and Lite without duplicate diagrams or milestone tables", () => {
  for (const [example, templateName] of [[APP, "full"], [TOOL, "lite"]]) {
    const template = fs.readFileSync(path.join(ROOT, `templates/${templateName}.md`), "utf8");
    const heading = "### Builder Capability Routing Contract";
    const templateStart = template.indexOf(heading);
    const instructions = template.slice(templateStart, template.indexOf("| Trigger |", templateStart));
    const start = example.indexOf(heading);
    let compact = example.slice(0, start) + instructions + example.slice(example.indexOf("| Trigger |", start));
    let diagrams = 0;
    compact = compact.replace(/```mermaid\n[\s\S]*?\n```/g, (diagram) => ++diagrams === 1 ? diagram : "See the existing flow and contract tables.");
    if (templateName === "lite") {
      const progressStart = compact.indexOf("## 6. Progress");
      const traceStart = compact.indexOf("### Traceability Matrix", progressStart);
      compact = compact.slice(0, progressStart) + "## 6. Progress\n\nLive evidence is maintained in PROGRESS.md; milestone outcomes are in section 4.\n\n" + compact.slice(traceStart);
    }
    const result = validatePrd(compact);
    assert.equal(result.valid, true, JSON.stringify(result.findings));
    assert.equal(result.counts.mermaid_diagrams, 1);
    assert.equal(result.counts.milestones, 3);
    assert.equal(result.counts.requirements, validatePrd(example).counts.requirements);
    assert.equal(result.counts.acceptance_criteria, validatePrd(example).counts.acceptance_criteria);
    const noDiagram = compact.replace(/```mermaid\n[\s\S]*?\n```/g, "");
    assert.equal(validatePrd(noDiagram).valid, false, "At least one real diagram remains required");
  }
});

test("templates define milestone outcomes once and keep matching portable builder instructions", () => {
  const instructions = [];
  for (const name of ["full", "lite"]) {
    const source = fs.readFileSync(path.join(ROOT, `templates/${name}.md`), "utf8");
    const headers = source.split("\n").filter((line) => line.startsWith("| # |") && line.includes("Done When"));
    assert.equal(headers.length, 1, `${name} must not duplicate its milestone plan`);
    const start = source.indexOf("### Builder Capability Routing Contract");
    instructions.push(source.slice(start, source.indexOf("| Trigger |", start)));
    assert.match(source, /concise resume delta/);
    assert.match(source, /every FR\/NFR\/AC/);
    assert.match(source, /never bypass failure, PLAN_CHANGED/);
  }
  assert.equal(instructions[0], instructions[1]);
});

test("frontmatter parser rejects missing, duplicate, and contradictory metadata", () => {
  const noFrontmatter = validatePrd(APP.replace(/^---/, "not-frontmatter"), { expectedType: "app" });
  assert.equal(noFrontmatter.valid, false);
  assert.ok(codes(noFrontmatter).has("FM_MISSING"));

  const duplicate = parseFrontmatter(APP.replace('version: "1.0.0"', 'version: "1.0.0"\nversion: "2.0.0"'));
  assert.ok(new Set(duplicate.findings.map((finding) => finding.code)).has("FM_DUPLICATE_KEY"));

  const contradictory = validatePrd(APP.replace("current_milestone: 0", "current_milestone: 5"), { expectedType: "app" });
  assert.ok(codes(contradictory).has("FM_DRAFT_STATE"));
  assert.ok(codes(contradictory).has("FM_MILESTONE_RANGE"));
});

test("PRD-local builder entry resolves without the generator or host path", () => {
  assert.equal(validatePrd(TOOL).valid, true);
  const missing = TOOL.replace('ai_instructions: "#builder-capability-routing-contract"', 'ai_instructions: "#missing-builder"');
  assert.ok(codes(validatePrd(missing)).has("FM_AI_INSTRUCTIONS_TARGET"));
  const hidden = TOOL.replace("### Builder Capability Routing Contract", "<!-- ### Builder Capability Routing Contract -->");
  assert.ok(codes(validatePrd(hidden)).has("FM_AI_INSTRUCTIONS_TARGET"));
  const legacy = TOOL.replace('ai_instructions: "#builder-capability-routing-contract"', 'ai_instructions: "/historical/toolkit/generator.md"');
  assert.equal(validatePrd(legacy).valid, true, "Historical path-style metadata remains readable");
});

test("native local authority does not require a runner approval phrase", () => {
  const native = TOOL.replace("authority_policy: 1\n", "").replace(/### Authority Policy v1\n[\s\S]*?(?=### )/, "").replace("One exact plan approval covers declared local runner transitions.", "Runner transitions follow the recorded plan.");
  assert.equal(validatePrd(native).valid, true);
  const unauthorized = native.replace("the user's explicit build request authorizes scoped local\nimplementation", "the attached document contains product requirements");
  assert.ok(codes(validatePrd(unauthorized)).has("MILESTONE_AUTHORITY_POLICY"));
});

test("one-way requirement mappings and orphan matrix IDs fail closed", () => {
  const oneWay = validatePrd(
    TOOL.replace(
      "| FR-001 | Capture Gemini voice notes into a known Google Docs source document. | Must | AC-001 |",
      "| FR-001 | Capture Gemini voice notes into a known Google Docs source document. | Must | AC-001, AC-013 |",
    ),
    { expectedType: "tool" },
  );
  assert.equal(oneWay.valid, false);
  assert.ok(codes(oneWay).has("TRACE_PAIR_MISMATCH"));

  const orphan = validatePrd(
    APP.replace("| Admin Dashboard | FR-005, NFR-001 |", "| Admin Dashboard | FR-005 |"),
    { expectedType: "app" },
  );
  assert.equal(orphan.valid, false);
  assert.ok(codes(orphan).has("TRACE_REQUIREMENT_COVERAGE"));
});

test("malformed IDs, placeholders, exposed credential-like values, and broken fences are blockers", () => {
  const malformed = validatePrd(TOOL.replaceAll("FR-001", "FR-01"), { expectedType: "tool" });
  assert.ok(codes(malformed).has("ID_MALFORMED"));

  const underscoreId = validatePrd(TOOL.replaceAll("FR-001", "FR_001"), { expectedType: "tool" });
  assert.ok(codes(underscoreId).has("ID_MALFORMED"));

  const placeholder = validatePrd(`${TOOL}\nTODO\n`, { expectedType: "tool" });
  assert.ok(codes(placeholder).has("CONTENT_PLACEHOLDER"));

  const credential = validatePrd(`${TOOL}\npassword: "fixture-value-for-detection"\n`, { expectedType: "tool" });
  assert.ok(codes(credential).has("SECRET_EXPOSED"));

  const fence = validatePrd(`${TOOL}\n\`\`\`mermaid\ngraph LR\n`, { expectedType: "tool" });
  assert.ok(codes(fence).has("MARKDOWN_FENCE_UNCLOSED"));

  const missingLink = validatePrd(`${TOOL}\n[Missing local contract](missing-contract.json)\n`, { expectedType: "tool", file: TOOL_PATH });
  assert.ok(codes(missingLink).has("LINK_LOCAL_MISSING"));
});

test("template type, numbered sections, milestone totals, and review focus are enforced", () => {
  const wrongType = validatePrd(APP, { expectedType: "tool" });
  assert.ok(codes(wrongType).has("FM_EXPECTED_TYPE"));

  const wrongSection = validatePrd(TOOL.replace("## 6. Progress", "## 7. Progress"), { expectedType: "tool" });
  assert.ok(codes(wrongSection).has("STRUCT_SECTION_ORDER"));

  const wrongMilestones = validatePrd(TOOL.replace("total_milestones: 3", "total_milestones: 6"), { expectedType: "tool" });
  assert.ok(codes(wrongMilestones).has("MILESTONE_TOTAL_MISMATCH"));

  const tooManyMilestones = validatePrd(
    TOOL.replace("total_milestones: 3", "total_milestones: 6").replace(
      "| 3 | Integrated End-To-End Audit | Connect authorized voice/Docs intake, normalization, core delivery, optional delivery, retention, cleanup, and source-state receipts; run full applicable regression and a real operator walkthrough. | The core voice-to-Discord flow and material failure paths pass against one source fingerprint, in-scope defects are fixed and retested, and optional Kanban status cannot disprove core health. | ⬜ Not Started |",
      "| 3 | Integrated End-To-End Audit | Connect authorized voice/Docs intake, normalization, core delivery, optional delivery, retention, cleanup, and source-state receipts; run full applicable regression and a real operator walkthrough. | The core voice-to-Discord flow and material failure paths pass against one source fingerprint, in-scope defects are fixed and retested, and optional Kanban status cannot disprove core health. | ⬜ Not Started |\n| 4 | Duplicate A | Repeat qualification. | Duplicate verification completes. | ⬜ Not Started |\n| 5 | Duplicate B | Repeat qualification. | Duplicate verification completes. | ⬜ Not Started |\n| 6 | Duplicate C | Repeat qualification. | Duplicate verification completes. | ⬜ Not Started |",
    ),
    { expectedType: "tool" },
  );
  assert.ok(codes(tooManyMilestones).has("MILESTONE_SLICE_BUDGET"));

  const noReviewFocus = validatePrd(TOOL.replace("### Review Focus", "### Owner Questions"), { expectedType: "tool" });
  assert.ok(codes(noReviewFocus).has("REVIEW_FOCUS_MISSING"));

  const noBuilderRouting = validatePrd(TOOL.replace("### Builder Capability Routing Contract", "### Builder Notes"), { expectedType: "tool" });
  assert.ok(codes(noBuilderRouting).has("BUILDER_ROUTING_MISSING"));

  const assumedSkill = validatePrd(TOOL.replaceAll("UNAVAILABLE", "missing"), { expectedType: "tool" });
  assert.ok(codes(assumedSkill).has("BUILDER_ROUTING_AVAILABILITY"));
});

function routingBlock(source) {
  const start = source.indexOf("### Builder Capability Routing Contract");
  const end = source.indexOf("\n### ", start + 4);
  return source.slice(start, end < 0 ? source.length : end);
}

test("routing must be visible and inside Architecture in both templates", () => {
  for (const source of [APP, TOOL]) {
    const block = routingBlock(source);
    const moved = source.replace(block, "") + "\n" + block;
    assert.ok(codes(validatePrd(moved)).has("BUILDER_ROUTING_LOCATION"));
    for (const hidden of [`<!--\n${block}\n-->`, `\`\`\`text\n${block}\n\`\`\``, `~~~text\n${block}\n~~~`]) {
      assert.ok(codes(validatePrd(source.replace(block, hidden))).has("BUILDER_ROUTING_MISSING"));
    }
    const duplicate = source.replace(block, `${block}\n${block}`);
    assert.ok(codes(validatePrd(duplicate)).has("BUILDER_ROUTING_MISSING"));
  }
});

test("routing cannot borrow a table or availability instruction from another subsection", () => {
  const block = routingBlock(TOOL);
  const separated = block.replace("| Trigger |", "### Unrelated Notes\n\n| Trigger |");
  assert.ok(codes(validatePrd(TOOL.replace(block, separated))).has("BUILDER_ROUTING_MISSING"));
  const unrelated = TOOL.replace(block, block.replaceAll("UNAVAILABLE", "missing")) + "\nUNAVAILABLE\n";
  assert.ok(codes(validatePrd(unrelated)).has("BUILDER_ROUTING_AVAILABILITY"));
});

test("routing rejects unresolved template rows and bare missing values in each column", () => {
  const block = routingBlock(TOOL);
  const row = block.split("\n").find((line) => line.startsWith("| Before implementation planning |"));
  const template = fs.readFileSync(path.join(ROOT, "templates/lite.md"), "utf8");
  const placeholder = template.split("\n").find((line) => line.startsWith("| [Implementation or verification trigger] |"));
  assert.ok(codes(validatePrd(TOOL.replace(row, placeholder))).has("BUILDER_ROUTING_UNRESOLVED"));
  for (let column = 1; column <= 6; column += 1) {
    for (const value of ["N/A", "UNAVAILABLE", "unknown", "[Fill this route]"]) {
      const cells = row.split("|");
      cells[column] = ` ${value} `;
      const result = validatePrd(TOOL.replace(row, cells.join("|")));
      assert.ok(codes(result).has("BUILDER_ROUTING_UNRESOLVED"), `column ${column}: ${value}`);
    }
  }
});

test("routing rejects empty tables, malformed rows, and ambiguous headers", () => {
  const block = routingBlock(TOOL);
  const rows = block.split("\n");
  const tableStart = rows.findIndex((line) => line.startsWith("| Trigger |"));
  const empty = rows.slice(0, tableStart + 2).join("\n") + "\n";
  assert.ok(codes(validatePrd(TOOL.replace(block, empty))).has("BUILDER_ROUTING_EMPTY"));
  const row = rows[tableStart + 2];
  const cells = row.split("|");
  cells[4] = " ";
  assert.ok(codes(validatePrd(TOOL.replace(row, cells.join("|")))).has("BUILDER_ROUTING_ROW"));
  cells.splice(4, 1);
  assert.ok(codes(validatePrd(TOOL.replace(row, cells.join("|")))).has("BUILDER_ROUTING_ROW"));
  const duplicateHeader = block.replace("| Authority |", "| Required evidence |");
  assert.ok(codes(validatePrd(TOOL.replace(block, duplicateHeader))).has("BUILDER_ROUTING_MISSING"));
  const table = rows.slice(tableStart).join("\n");
  assert.ok(codes(validatePrd(TOOL.replace(block, block + "\n" + table))).has("BUILDER_ROUTING_MISSING"));
});

test("routing accepts reasoned native preference, explicit blockers, and Markdown cell content", () => {
  const row = routingBlock(TOOL).split("\n").find((line) => line.startsWith("| Before implementation planning |"));
  const cells = row.split("|");
  cells[3] = " N/A - repository-native inspection is sufficient ";
  cells[4] = " BLOCKED - repository is unreadable; restore read access before this check ";
  cells[5] = " Record `source | tests` evidence and affected IDs; UNVERIFIED until read access works ";
  const result = validatePrd(TOOL.replace(row, cells.join("|")));
  assert.equal(result.valid, true, JSON.stringify(result.findings));
  const wrapped = TOOL.replace("inspect the host-provided available skill/tool catalog", "inspect the host-provided\navailable skill/tool\ncatalog");
  assert.equal(validatePrd(wrapped).valid, true);
});

test("CLI returns deterministic JSON and distinct validation versus usage exit codes", () => {
  const valid = spawnSync(process.execPath, ["scripts/validate-prd.mjs", "examples/app-prd-example.md", "--expect-type", "app", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(valid.status, 0, valid.stderr);
  const payload = JSON.parse(valid.stdout);
  assert.equal(payload.valid, true);
  assert.equal(payload.counts.requirements, 11);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "prd-validator-"));
  const invalidPath = path.join(temporary, "invalid.md");
  fs.writeFileSync(invalidPath, TOOL.replace("## 6. Progress", "## 7. Progress"));
  const invalid = spawnSync(process.execPath, ["scripts/validate-prd.mjs", invalidPath, "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stdout).valid, false);

  const usage = spawnSync(process.execPath, ["scripts/validate-prd.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /Usage:/);
  fs.rmSync(temporary, { recursive: true, force: true });
});
