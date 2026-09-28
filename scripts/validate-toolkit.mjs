#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseFrontmatter, validatePrd } from "./validate-prd.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "..");

export const CANONICAL_PATHS = [
  ".gitignore",
  "LICENSE",
  ".gitattributes",
  ".github/workflows/check.yml",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/enhancement.md",
  ".github/pull_request_template.md",
  "AGENTS.md",
  "SKILL.md",
  "BASELINE.md",
  "CHANGELOG.md",
  "DECISIONS.md",
  "PROGRESS.md",
  "PROJECT_CONTEXT.md",
  "README.md",
  "package.json",
  ".reasonix/commands/prd/discover.md",
  ".reasonix/commands/prd/generate.md",
  ".reasonix/commands/prd/validate.md",
  ".reasonix/commands/prd/improve.md",
  ".reasonix/commands/prd/tasks.md",
  ".reasonix/commands/prd/execute.md",
  ".reasonix/commands/prd/audit.md",
  "docs/INDEX.md",
  "docs/REASONIX_ADAPTER.md",
  "docs/archive/README.md",
  "layout/INDEX.md",
  "layout/DISCOVER_PRODUCT.md",
  "layout/GENERATE_PRD.md",
  "layout/VALIDATE_PRD.md",
  "layout/IMPROVE_PRD.md",
  "layout/GENERATE_TASKS.md",
  "layout/EXECUTE_TASKS.md",
  "layout/AUDIT_IMPLEMENTATION.md",
  "prompts/SKILL.md",
  "prompts/PRD_GENERATOR_PROMPT.md",
  "prompts/PRD_VALIDATION_CHECKLIST.md",
  "prompts/PHASE_GATED_TASK_RUNNER.md",
  "prompts/RELIABILITY_GUIDE.md",
  "prompts/RESEARCH_AND_TOOL_ROUTING.md",
  "schemas/prd-frontmatter.schema.json",
  "schemas/generator-regression.schema.json",
  "schemas/task-plan.schema.json",
  "schemas/task-state.schema.json",
  "templates/full.md",
  "templates/lite.md",
  "templates/project-progress.md",
  "templates/project-decisions.md",
  "templates/task-plan.json",
  "examples/app-prd-example.md",
  "examples/tool-prd-example.md",
  "evals/generator-regression-cases.json",
  "evals/forward-test-report.md",
  "scripts/local-task-runner.mjs",
  "scripts/validate-prd.mjs",
  "scripts/preview-prd.mjs",
  "tests/preview-prd.test.mjs",
  "examples/prd-handoff-example.md",
  "scripts/validate-toolkit.mjs",
  "tests/local-task-runner.test.mjs",
  "tests/validate-prd.test.mjs",
  "tests/validate-toolkit.test.mjs",
  "docs/GETTING_STARTED.md",
  "docs/CONTRIBUTING.md",
  "docs/DISTRIBUTION.md",
  "evals/efficiency-rework-2026-09-12.md",
  "evals/git-readiness-2026-09-27.md",
  "scripts/export-toolkit.mjs",
  "tests/distribution.test.mjs",
  "docs/CONVERSATION_TO_UNIVERSAL_PRD_LESSONS.md",
];

const REASONIX_COMMANDS = new Map([
  [".reasonix/commands/prd/discover.md", "layout/DISCOVER_PRODUCT.md"],
  [".reasonix/commands/prd/generate.md", "layout/GENERATE_PRD.md"],
  [".reasonix/commands/prd/validate.md", "layout/VALIDATE_PRD.md"],
  [".reasonix/commands/prd/improve.md", "layout/IMPROVE_PRD.md"],
  [".reasonix/commands/prd/tasks.md", "layout/GENERATE_TASKS.md"],
  [".reasonix/commands/prd/execute.md", "layout/EXECUTE_TASKS.md"],
  [".reasonix/commands/prd/audit.md", "layout/AUDIT_IMPLEMENTATION.md"],
]);

const FULL_SECTIONS = [
  "Overview",
  "Requirements",
  "Core Features",
  "User Flow",
  "Architecture",
  "Data Models",
  "Design System",
  "API Spec",
  "File Map",
  "Milestones",
];

const LITE_SECTIONS = [
  "Overview",
  "Requirements",
  "Architecture & Data Flow",
  "Implementation & Milestones",
  "Risks",
  "Progress",
];

const REQUIRED_FRONTMATTER_KEYS = [
  "project",
  "version",
  "status",
  "current_milestone",
  "total_milestones",
  "type",
  "tech_stack",
  "created",
  "ai_instructions",
];

function addFinding(findings, code, message, file = null, line = null) {
  findings.push({ code, severity: "error", message, file, line });
}

function walkMarkdown(root) {
  const results = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if ([".git", ".DS_Store", "node_modules", "coverage", "runs", "dist", ".prd", "autoresearch"].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) results.push(absolute);
    }
  };
  visit(root);
  return results;
}

function relative(root, absolute) {
  return path.relative(root, absolute).split(path.sep).join("/");
}

function splitTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  const cells = [];
  let current = "";
  let escaped = false;
  let inCode = false;
  for (const character of trimmed.slice(1, -1)) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      current += character;
      escaped = true;
    } else if (character === "`") {
      current += character;
      inCode = !inCode;
    } else if (character === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
    } else current += character;
  }
  cells.push(current.trim());
  return cells;
}

function validateMarkdownFiles(root, findings) {
  const files = walkMarkdown(root);
  let linksChecked = 0;
  let tablesChecked = 0;
  let fencesChecked = 0;
  let linesScanned = 0;
  const directSecretPatterns = [
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bsk-[A-Za-z0-9_-]{16,}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}={0,2}\b/i,
  ];

  for (const absolute of files) {
    const file = relative(root, absolute);
    const source = fs.readFileSync(absolute, "utf8").replace(/\r\n?/g, "\n");
    const lines = source.split("\n");
    let openFence = null;
    for (let index = 0; index < lines.length; index += 1) {
      linesScanned += 1;
      if (/\/(?:Users|home)\/[A-Za-z0-9_.-]+\//.test(lines[index])) addFinding(findings, "PUBLIC_PERSONAL_PATH", "Public toolkit documentation must not contain an author's home-directory path.", file, index + 1);
      if (directSecretPatterns.some((pattern) => pattern.test(lines[index]))) addFinding(findings, "MD_SECRET_EXPOSED", "Markdown contains a value resembling a credential or private key.", file, index + 1);
      const fence = lines[index].match(/^\s*```/);
      if (fence) {
        fencesChecked += 1;
        openFence = openFence === null ? index + 1 : null;
      }
      const cells = splitTableRow(lines[index]);
      if (cells.length > 0) {
        const previous = index > 0 ? splitTableRow(lines[index - 1]) : [];
        const next = index + 1 < lines.length ? splitTableRow(lines[index + 1]) : [];
        const expected = previous.length > 0 ? previous.length : next.length;
        if (expected > 0 && cells.length !== expected) {
          addFinding(findings, "MD_TABLE_COLUMNS", `Markdown table row has ${cells.length} cells; expected ${expected}.`, file, index + 1);
        }
        tablesChecked += 1;
      }
    }
    if (openFence !== null) addFinding(findings, "MD_FENCE_UNCLOSED", "Markdown code fence is not closed.", file, openFence);

    const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
    for (const match of source.matchAll(linkPattern)) {
      let target = match[1].trim();
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
      try {
        target = decodeURIComponent(target.split("#")[0]);
      } catch {
        const line = source.slice(0, match.index).split("\n").length;
        addFinding(findings, "MD_LOCAL_LINK_ENCODING", `Local Markdown link has invalid percent encoding: ${target}.`, file, line);
        continue;
      }
      if (target === "") continue;
      const targetPath = path.isAbsolute(target) ? target : path.resolve(path.dirname(absolute), target);
      linksChecked += 1;
      if (!fs.existsSync(targetPath)) {
        const line = source.slice(0, match.index).split("\n").length;
        addFinding(findings, "MD_LOCAL_LINK", `Local Markdown link target does not exist: ${target}.`, file, line);
      }
    }
  }

  return { files: files.length, links_checked: linksChecked, table_rows_checked: tablesChecked, fence_markers_checked: fencesChecked, secret_lines_scanned: linesScanned };
}

function validateTemplate(root, file, expectedType, expectedSections, findings) {
  const absolute = path.join(root, file);
  const source = fs.readFileSync(absolute, "utf8");
  const parsed = parseFrontmatter(source);
  for (const finding of parsed.findings) addFinding(findings, `TEMPLATE_${finding.code}`, finding.message, file, finding.line);
  const keys = Object.keys(parsed.data).sort();
  const expectedKeys = [...REQUIRED_FRONTMATTER_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    addFinding(findings, "TEMPLATE_FRONTMATTER_KEYS", "Template frontmatter keys do not exactly match the canonical schema.", file, 1);
  }
  if (parsed.data.type !== expectedType) addFinding(findings, "TEMPLATE_TYPE", `Template type must be ${expectedType}.`, file, 1);
  if (parsed.data.ai_instructions !== "#builder-capability-routing-contract") addFinding(findings, "TEMPLATE_BUILDER_ENTRY", "New PRDs must point ai_instructions to their embedded builder contract.", file, 1);
  if (parsed.data.status !== "draft" || parsed.data.current_milestone !== 0) {
    addFinding(findings, "TEMPLATE_DRAFT_STATE", "New PRD template must start as draft at current_milestone 0.", file, 1);
  }
  const sections = [...source.matchAll(/^##\s+(\d+)\.\s+(.+?)\s*$/gm)].map((match) => ({ number: Number(match[1]), title: match[2] }));
  expectedSections.forEach((title, index) => {
    if (sections[index]?.number !== index + 1 || sections[index]?.title !== title) {
      addFinding(findings, "TEMPLATE_SECTION_ORDER", `Section ${index + 1} must be exactly "${title}".`, file, 1);
    }
  });
  if (sections.length !== expectedSections.length) {
    addFinding(findings, "TEMPLATE_SECTION_COUNT", `Template requires exactly ${expectedSections.length} numbered sections; found ${sections.length}.`, file, 1);
  }
}

function parseReasonixFrontmatter(source) {
  const normalized = source.replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) return { data: {}, findings: [{ code: "FM_MISSING", message: "Reasonix command requires frontmatter.", line: 1 }] };
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, findings: [{ code: "FM_UNCLOSED", message: "Reasonix command frontmatter is not closed.", line: 1 }] };
  const data = {};
  const findings = [];
  const lines = normalized.slice(4, end).split("\n");
  lines.forEach((line, index) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.+)$/);
    if (!match) findings.push({ code: "FM_SYNTAX", message: "Reasonix frontmatter must use simple key: value lines.", line: index + 2 });
    else data[match[1]] = match[2].trim();
  });
  return { data, findings };
}

function validateReasonixAdapter(root, findings) {
  let validCommands = 0;
  for (const [file, layout] of REASONIX_COMMANDS) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const source = fs.readFileSync(absolute, "utf8");
    const frontmatter = parseReasonixFrontmatter(source);
    for (const finding of frontmatter.findings) addFinding(findings, `REASONIX_${finding.code}`, finding.message, file, finding.line);
    if (typeof frontmatter.data.description !== "string" || frontmatter.data.description.trim().length < 10) {
      addFinding(findings, "REASONIX_DESCRIPTION", "Reasonix command requires a specific description.", file, 1);
    }
    if (typeof frontmatter.data["argument-hint"] !== "string" || !frontmatter.data["argument-hint"].includes("target-project-root")) {
      addFinding(findings, "REASONIX_ARGUMENT_HINT", "Reasonix command must declare the target-project-root argument.", file, 1);
    }
    for (const required of [
      "$1",
      "$ARGUMENTS",
      "toolkit root",
      "docs/REASONIX_ADAPTER.md",
      layout,
    ]) {
      if (!source.includes(required)) addFinding(findings, "REASONIX_COMMAND_CONTRACT", `Reasonix command is missing required contract reference: ${required}.`, file);
    }
    if (/--yolo|dangerously-skip-permissions/i.test(source)) {
      addFinding(findings, "REASONIX_UNSAFE_POSTURE", "Reasonix PRD commands must not enable an unrestricted permission posture.", file);
    }
    validCommands += 1;
  }

  const adapterFile = "docs/REASONIX_ADAPTER.md";
  const adapterAbsolute = path.join(root, adapterFile);
  if (fs.existsSync(adapterAbsolute) && fs.statSync(adapterAbsolute).isFile()) {
    const source = fs.readFileSync(adapterAbsolute, "utf8");
    for (const required of [
      "## Shared Efficiency Contract",
      "## Authority And Pause Contract",
      "## Summary Contract",
      "Do not require Ponytail, Caveman, Honey, Spec Kit, SpecD",
      "Structural validation, implementation, runtime behavior, deployment, production",
    ]) {
      if (!source.includes(required)) addFinding(findings, "REASONIX_ADAPTER_POLICY", `Reasonix adapter documentation is missing: ${required}.`, adapterFile);
    }
  }
  return validCommands;
}

function validateLifecycleFlow(root, findings) {
  const discoveryFile = "layout/DISCOVER_PRODUCT.md";
  const auditFile = "layout/AUDIT_IMPLEMENTATION.md";
  const routingFile = "prompts/RESEARCH_AND_TOOL_ROUTING.md";
  const generatorFile = "prompts/PRD_GENERATOR_PROMPT.md";
  let lifecycleOperations = 0;

  if (fs.existsSync(path.join(root, discoveryFile))) {
    const source = fs.readFileSync(path.join(root, discoveryFile), "utf8");
    for (const required of [
      "@project/DISCOVERY.md",
      "Evidence Ledger",
      "PRD Handoff Summary",
      "READY_FOR_PRD",
      "NEEDS_OWNER_INPUT",
      "NOT_YET_JUSTIFIED",
      "Do not create a PRD, TASKS.json",
    ]) {
      if (!source.includes(required)) addFinding(findings, "DISCOVERY_CONTRACT", `Discovery layout is missing: ${required}.`, discoveryFile);
    }
    lifecycleOperations += 1;
  }

  if (fs.existsSync(path.join(root, auditFile))) {
    const source = fs.readFileSync(path.join(root, auditFile), "utf8");
    for (const required of [
      "@project/IMPLEMENTATION_AUDIT.md",
      "every FR-###, NFR-###, and AC-###",
      "VERIFIED, PARTIAL, NOT_IMPLEMENTED, UNVERIFIED",
      "full applicable regression suite",
      "Do not modify application code",
      "Never claim production readiness or owner acceptance",
    ]) {
      if (!source.includes(required)) addFinding(findings, "CONFORMANCE_AUDIT_CONTRACT", `Implementation audit layout is missing: ${required}.`, auditFile);
    }
    lifecycleOperations += 1;
  }

  if (fs.existsSync(path.join(root, routingFile))) {
    const source = fs.readFileSync(path.join(root, routingFile), "utf8");
    for (const required of [
      "## Lifecycle Tool Map",
      "## Evaluated Efficiency Patterns",
      "RTK only after a measured",
      "Headroom remains experimental",
      "Do not install Superpowers, Headroom, RTK",
    ]) {
      if (!source.includes(required)) addFinding(findings, "LIFECYCLE_TOOL_POLICY", `Research and tool routing is missing: ${required}.`, routingFile);
    }
  }

  if (fs.existsSync(path.join(root, generatorFile))) {
    const source = fs.readFileSync(path.join(root, generatorFile), "utf8");
    if (!source.includes("EARS-style") || !source.includes("THE SYSTEM SHALL")) addFinding(findings, "AC_OBSERVABILITY_POLICY", "Generator must retain selective EARS-style observable acceptance guidance.", generatorFile);
    for (const required of ["## Builder Capability Routing Contract", "host-provided available", "UNAVAILABLE", "A name in the PRD does not install it or make it callable"]) {
      if (!source.includes(required)) addFinding(findings, "BUILDER_ROUTING_GENERATOR_POLICY", `Generator is missing builder-routing policy: ${required}.`, generatorFile);
    }
  }

  for (const templateFile of ["templates/full.md", "templates/lite.md"]) {
    if (!fs.existsSync(path.join(root, templateFile))) continue;
    const source = fs.readFileSync(path.join(root, templateFile), "utf8");
    for (const required of ["### Builder Capability Routing Contract", "Preferred skill/tool if available", "Fallback if unavailable", "Required evidence", "Authority"]) {
      if (!source.includes(required)) addFinding(findings, "BUILDER_ROUTING_TEMPLATE_POLICY", `PRD template is missing builder-routing contract: ${required}.`, templateFile);
    }
    // Templates intentionally contain placeholders; their visible routing
    // location, table, and availability instructions must still be usable.
    for (const finding of validatePrd(source).findings.filter((entry) => entry.code.startsWith("BUILDER_ROUTING_") && entry.code !== "BUILDER_ROUTING_UNRESOLVED")) {
      addFinding(findings, "BUILDER_ROUTING_TEMPLATE_POLICY", finding.message, templateFile, finding.line);
    }
  }

  return lifecycleOperations;
}

function extractQuotedUppercase(source) {
  return new Set([...source.matchAll(/["`]([A-Z][A-Z0-9_]+)["`]/g)].map((match) => match[1]));
}

function setsEqual(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

export function validateVersionContract(packageJson, baselineSource, changelogSource) {
  const findings = [];
  const add = (code, message) => findings.push({ code, message });
  const normalizedBaseline = baselineSource.replace(/\s+/g, " ");
  const expectedScripts = {
    "validate:prd": "node scripts/validate-prd.mjs",
    "validate:toolkit": "node scripts/validate-toolkit.mjs --json",
    test: "node --test tests",
    check: "node scripts/validate-toolkit.mjs --json && node --test tests",
  };
  if (!packageJson || typeof packageJson !== "object" || Array.isArray(packageJson)) {
    add("VERSION_PACKAGE_OBJECT", "package.json must be an object.");
    return findings;
  }
  if (packageJson.name !== "prd-toolkit") add("VERSION_PACKAGE_NAME", "package name must be prd-toolkit.");
  if (typeof packageJson.version !== "string" || !/^\d+\.\d+\.\d+$/.test(packageJson.version)) add("VERSION_SEMVER", "package version must use stable semantic x.y.z form.");
  if (packageJson.private !== true) add("VERSION_PRIVATE", "package.json must remain private to prevent accidental publication.");
  if (packageJson.type !== "module") add("VERSION_MODULE_TYPE", "package.json type must remain module.");
  if (packageJson.engines?.node !== ">=20.0.0") add("VERSION_NODE_ENGINE", "Node.js baseline must be >=20.0.0.");
  const scriptKeys = packageJson.scripts && typeof packageJson.scripts === "object" && !Array.isArray(packageJson.scripts) ? Object.keys(packageJson.scripts).sort() : [];
  const expectedScriptKeys = Object.keys(expectedScripts).sort();
  if (JSON.stringify(scriptKeys) !== JSON.stringify(expectedScriptKeys) || expectedScriptKeys.some((key) => packageJson.scripts[key] !== expectedScripts[key])) add("VERSION_SCRIPTS", "Baseline package scripts differ from the canonical dependency-free commands.");
  if ((packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) || (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0)) {
    add("VERSION_DEPENDENCIES", "The baseline package must remain dependency-free.");
  }

  if (typeof packageJson.version === "string") {
    const escaped = packageJson.version.replace(/\./g, "\\.");
    if (!new RegExp(`^\\| Version \\| ${escaped} \\|$`, "m").test(baselineSource)) add("VERSION_BASELINE_MISMATCH", `BASELINE.md does not declare version ${packageJson.version}.`);
    if (!new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m").test(changelogSource)) add("VERSION_CHANGELOG_MISMATCH", `CHANGELOG.md has no dated ${packageJson.version} entry.`);
  }
  if (!/^## \[Unreleased\]$/m.test(changelogSource)) add("VERSION_UNRELEASED_MISSING", "CHANGELOG.md must retain an Unreleased section.");
  if (!/Level 1 — unit-verified structural contracts only/.test(baselineSource)) add("VERSION_READINESS", "BASELINE.md must state the bounded Level 1 evidence claim.");
  if (!/not evidence of a Git commit, tag, npm publication, deployment, or production activation/i.test(normalizedBaseline)) add("VERSION_EVIDENCE_BOUNDARY", "BASELINE.md must deny unsupported Git, publication, deployment, and production claims.");
  return findings;
}

function validateArchive(root, findings) {
  const archiveRoot = path.join(root, "docs/archive");
  if (!fs.existsSync(archiveRoot) || !fs.statSync(archiveRoot).isDirectory()) return 0;
  const archived = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md") && absolute !== path.join(archiveRoot, "README.md")) archived.push(absolute);
    }
  };
  visit(archiveRoot);
  for (const absolute of archived) {
    const file = relative(root, absolute);
    const parsed = parseFrontmatter(fs.readFileSync(absolute, "utf8"));
    for (const finding of parsed.findings) addFinding(findings, `ARCHIVE_${finding.code}`, finding.message, file, finding.line);
    const expectedKeys = ["archive_status", "archived_at", "superseded_by", "reason"].sort();
    if (JSON.stringify(Object.keys(parsed.data).sort()) !== JSON.stringify(expectedKeys)) addFinding(findings, "ARCHIVE_METADATA_KEYS", "Archived document metadata must contain exactly archive_status, archived_at, superseded_by, and reason.", file, 1);
    if (parsed.data.archive_status !== "historical") addFinding(findings, "ARCHIVE_STATUS", "Archived document must use archive_status: historical.", file, 1);
    if (typeof parsed.data.archived_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.archived_at)) addFinding(findings, "ARCHIVE_DATE", "Archived document must declare archived_at as YYYY-MM-DD.", file, 1);
    if (typeof parsed.data.reason !== "string" || parsed.data.reason.trim().length < 10) addFinding(findings, "ARCHIVE_REASON", "Archived document requires a specific reason.", file, 1);
    if (typeof parsed.data.superseded_by !== "string" || path.isAbsolute(parsed.data.superseded_by) || parsed.data.superseded_by.split(/[\\/]/).includes("..")) addFinding(findings, "ARCHIVE_REPLACEMENT_PATH", "superseded_by must be a safe repository-relative path.", file, 1);
    else if (!fs.existsSync(path.join(root, parsed.data.superseded_by))) addFinding(findings, "ARCHIVE_REPLACEMENT_MISSING", `Archived replacement does not exist: ${parsed.data.superseded_by}.`, file, 1);
  }
  return archived.length;
}

function validateSynthesisStructure(root, findings) {
  const file = "docs/CONVERSATION_TO_UNIVERSAL_PRD_LESSONS.md";
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return 0;
  const source = fs.readFileSync(absolute, "utf8");
  const sections = [...source.matchAll(/^## (\d+)\.\s+.+$/gm)].map((match) => Number(match[1]));
  if (sections.length !== 14 || sections.some((number, index) => number !== index + 1)) addFinding(findings, "DOC_SYNTHESIS_SECTIONS", `Evidence synthesis must retain exactly 14 sequential numbered sections; found ${sections.join(", ") || "none"}.`, file);
  return sections.length;
}

function validateFailureTaxonomy(root, taskStateSchema, findings) {
  const guide = fs.readFileSync(path.join(root, "prompts/RELIABILITY_GUIDE.md"), "utf8");
  const runner = fs.readFileSync(path.join(root, "scripts/local-task-runner.mjs"), "utf8");
  const guideSection = guide.slice(guide.indexOf("## Environment and Failure Classification"), guide.indexOf("## Verification Receipt"));
  const runnerSection = runner.slice(runner.indexOf("const FAILURE_CLASSIFICATIONS"), runner.indexOf("]);", runner.indexOf("const FAILURE_CLASSIFICATIONS")) + 3);
  const guideSet = extractQuotedUppercase(guideSection);
  const runnerSet = extractQuotedUppercase(runnerSection);
  const schemaSet = new Set(taskStateSchema.$defs?.failure?.properties?.classification?.enum ?? []);
  if (guideSet.size !== 15) addFinding(findings, "FAILURE_TAXONOMY_COUNT", `Reliability guide must define exactly 15 official classifications; found ${guideSet.size}.`, "prompts/RELIABILITY_GUIDE.md");
  if (!setsEqual(guideSet, runnerSet)) addFinding(findings, "FAILURE_TAXONOMY_RUNNER", "Runner failure classifications differ from the reliability guide.", "scripts/local-task-runner.mjs");
  if (!setsEqual(guideSet, schemaSet)) addFinding(findings, "FAILURE_TAXONOMY_SCHEMA", "Task-state schema failure classifications differ from the reliability guide.", "schemas/task-state.schema.json");
  return guideSet.size;
}

function validateRegressionManifest(root, findings) {
  const file = "evals/generator-regression-cases.json";
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  } catch (error) {
    addFinding(findings, "EVAL_MANIFEST_JSON", `Cannot parse regression manifest: ${error.message}`, file);
    return { total: 0, passed: 0, failed: 0, cases: [] };
  }
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.cases) || manifest.cases.length < 2) {
    addFinding(findings, "EVAL_MANIFEST_SCHEMA", "Regression manifest must use schema_version 1 and contain at least two cases.", file);
    return { total: manifest.cases?.length ?? 0, passed: 0, failed: manifest.cases?.length ?? 0, cases: [] };
  }

  const ids = new Set();
  const results = [];
  for (const entry of manifest.cases) {
    const caseErrors = [];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      caseErrors.push("case must be an object");
      results.push({ id: null, passed: false, errors: caseErrors });
      continue;
    }
    const allowedKeys = new Set(["id", "rough_idea", "output", "expected_type", "mutation", "expected_valid", "expected_counts", "required_contracts", "expected_finding_codes"]);
    const requiredKeys = ["id", "rough_idea", "output", "expected_type", "expected_valid", "required_contracts", "expected_finding_codes"];
    for (const key of Object.keys(entry)) {
      if (!allowedKeys.has(key)) caseErrors.push(`unknown key ${key}`);
    }
    for (const key of requiredKeys) {
      if (!Object.hasOwn(entry, key)) caseErrors.push(`missing key ${key}`);
    }
    if (typeof entry.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) caseErrors.push("id must use lower-kebab-case");
    else if (ids.has(entry.id)) caseErrors.push("id is duplicated");
    else ids.add(entry.id);
    if (typeof entry.rough_idea !== "string" || entry.rough_idea.trim().length < 20) caseErrors.push("rough_idea must be a representative non-empty prompt");
    if (!new Set(["app", "tool"]).has(entry.expected_type)) caseErrors.push("expected_type must be app or tool");
    if (typeof entry.expected_valid !== "boolean") caseErrors.push("expected_valid must be Boolean");
    if (!Array.isArray(entry.expected_finding_codes) || entry.expected_finding_codes.some((code) => typeof code !== "string" || !/^[A-Z][A-Z0-9_]+$/.test(code)) || new Set(entry.expected_finding_codes).size !== entry.expected_finding_codes.length) caseErrors.push("expected_finding_codes must contain unique stable finding-code strings");
    if (!Array.isArray(entry.required_contracts) || entry.required_contracts.some((contract) => typeof contract !== "string" || contract.trim() === "") || new Set(entry.required_contracts).size !== entry.required_contracts.length) caseErrors.push("required_contracts must contain unique non-empty strings");
    if (entry.expected_valid === false && Array.isArray(entry.expected_finding_codes) && entry.expected_finding_codes.length === 0) caseErrors.push("an invalid case must name at least one expected finding code");
    if (typeof entry.output !== "string" || path.isAbsolute(entry.output) || entry.output.split(/[\\/]/).includes("..")) caseErrors.push("output must be a safe repository-relative path");

    if (entry.expected_counts !== undefined) {
      const allowedCountKeys = new Set(["sections", "requirements", "acceptance_criteria", "traceability_rows", "mermaid_diagrams", "milestones"]);
      if (!entry.expected_counts || typeof entry.expected_counts !== "object" || Array.isArray(entry.expected_counts)) caseErrors.push("expected_counts must be an object");
      else {
        for (const [key, value] of Object.entries(entry.expected_counts)) {
          if (!allowedCountKeys.has(key) || !Number.isInteger(value) || value < 1) caseErrors.push(`expected_counts.${key} is not an allowed positive integer`);
        }
      }
    }

    let source = "";
    const outputPath = typeof entry.output === "string" ? path.resolve(root, entry.output) : root;
    if (!outputPath.startsWith(`${root}${path.sep}`) || !fs.existsSync(outputPath) || !fs.statSync(outputPath).isFile()) caseErrors.push("output file does not exist inside the toolkit");
    else source = fs.readFileSync(outputPath, "utf8");

    if (entry.mutation !== undefined) {
      if (!entry.mutation || typeof entry.mutation !== "object" || Array.isArray(entry.mutation) || Object.keys(entry.mutation).some((key) => !new Set(["find", "replace"]).has(key)) || Object.keys(entry.mutation).length !== 2 || typeof entry.mutation.find !== "string" || typeof entry.mutation.replace !== "string" || entry.mutation.find === "") caseErrors.push("mutation must contain only non-empty find and string replace values");
      else {
        const occurrences = source.split(entry.mutation.find).length - 1;
        if (occurrences !== 1) caseErrors.push(`mutation find must match exactly once; found ${occurrences}`);
        else source = source.replace(entry.mutation.find, entry.mutation.replace);
      }
    }

    const validation = source ? validatePrd(source, { expectedType: entry.expected_type, file: outputPath }) : null;
    if (validation) {
      if (validation.valid !== entry.expected_valid) caseErrors.push(`expected valid=${entry.expected_valid}, received ${validation.valid}`);
      const codes = new Set(validation.findings.map((finding) => finding.code));
      for (const code of entry.expected_finding_codes ?? []) {
        if (!codes.has(code)) caseErrors.push(`expected finding ${code} was not emitted`);
      }
      for (const contract of entry.required_contracts ?? []) {
        if (typeof contract !== "string" || !source.includes(contract)) caseErrors.push(`required contract ${String(contract)} is absent`);
      }
      if (entry.expected_counts) {
        for (const [key, expected] of Object.entries(entry.expected_counts)) {
          if (validation.counts[key] !== expected) caseErrors.push(`expected counts.${key}=${expected}, received ${String(validation.counts[key])}`);
        }
      }
    }

    results.push({
      id: entry.id ?? null,
      passed: caseErrors.length === 0,
      expected_valid: entry.expected_valid,
      observed_valid: validation?.valid ?? null,
      finding_codes: validation ? unique(validation.findings.map((finding) => finding.code)).sort() : [],
      errors: caseErrors,
    });
  }

  for (const result of results) {
    if (!result.passed) addFinding(findings, "EVAL_CASE_FAILED", `${result.id ?? "unnamed case"}: ${result.errors.join("; ")}.`, file);
  }
  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    cases: results,
  };
}

function unique(values) {
  return [...new Set(values)];
}

function sourceFingerprint(root, paths) {
  const hash = crypto.createHash("sha256");
  for (const file of [...paths].sort()) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    hash.update(file);
    hash.update("\0");
    hash.update(fs.readFileSync(absolute));
    hash.update("\0");
  }
  return `manifest-sha256:${hash.digest("hex")}`;
}

export function validateToolkit(root = DEFAULT_ROOT) {
  const absoluteRoot = path.resolve(root);
  const findings = [];
  const hasFile = (file) => {
    const absolute = path.join(absoluteRoot, file);
    return fs.existsSync(absolute) && fs.statSync(absolute).isFile();
  };
  for (const file of CANONICAL_PATHS) {
    const absolute = path.join(absoluteRoot, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) addFinding(findings, "CANONICAL_FILE_MISSING", "Canonical toolkit file is missing.", file);
  }

  const parsedJson = {};
  for (const file of [
    "package.json",
    "schemas/prd-frontmatter.schema.json",
    "schemas/generator-regression.schema.json",
    "schemas/task-plan.schema.json",
    "schemas/task-state.schema.json",
    "templates/task-plan.json",
  ]) {
    try {
      parsedJson[file] = JSON.parse(fs.readFileSync(path.join(absoluteRoot, file), "utf8"));
    } catch (error) {
      addFinding(findings, "JSON_PARSE", `JSON parsing failed: ${error.message}`, file);
    }
  }

  const taskPlanSchema = parsedJson["schemas/task-plan.schema.json"];
  const taskStateSchema = parsedJson["schemas/task-state.schema.json"];
  const regressionSchema = parsedJson["schemas/generator-regression.schema.json"];
  const taskPlanTemplate = parsedJson["templates/task-plan.json"];
  const packageJson = parsedJson["package.json"];
  if (regressionSchema && regressionSchema.properties?.schema_version?.const !== 1) addFinding(findings, "EVAL_SCHEMA_VERSION", "Generator-regression schema must require schema_version 1.", "schemas/generator-regression.schema.json");
  if (taskPlanSchema && taskPlanSchema.properties?.schema_version?.const !== 2) addFinding(findings, "TASK_PLAN_SCHEMA_VERSION", "Task-plan schema must require schema_version 2.", "schemas/task-plan.schema.json");
  if (taskStateSchema && taskStateSchema.properties?.schema_version?.const !== 2) addFinding(findings, "TASK_STATE_SCHEMA_VERSION", "Task-state schema must require schema_version 2.", "schemas/task-state.schema.json");
  if (taskPlanTemplate && taskPlanTemplate.schema_version !== 2) addFinding(findings, "TASK_TEMPLATE_VERSION", "Task-plan template must use schema_version 2.", "templates/task-plan.json");
  if (taskPlanTemplate && (!Array.isArray(taskPlanTemplate.tasks) || taskPlanTemplate.tasks.length < 2 || taskPlanTemplate.tasks.length > 3)) addFinding(findings, "TASK_TEMPLATE_SLICE_BUDGET", "Canonical new-plan template must demonstrate the default two or three outcome milestones, including final audit.", "templates/task-plan.json");
  if (taskPlanTemplate && Array.isArray(taskPlanTemplate.tasks) && taskPlanTemplate.tasks.at(-1)?.layer !== "qualification") addFinding(findings, "TASK_TEMPLATE_FINAL_AUDIT", "Canonical new-plan template must end with a qualification-layer integrated audit task; final human acceptance remains outside autonomous execution.", "templates/task-plan.json");
  if (hasFile("scripts/local-task-runner.mjs") && /reasons\.push\(["']layer_changed["']\)/.test(fs.readFileSync(path.join(absoluteRoot, "scripts/local-task-runner.mjs"), "utf8"))) addFinding(findings, "RUNNER_LAYER_GATE", "A descriptive layer change must not create a runner checkpoint.", "scripts/local-task-runner.mjs");
  if (hasFile("scripts/local-task-runner.mjs") && /reasons\.push\(["']phase_advanced["']\)/.test(fs.readFileSync(path.join(absoluteRoot, "scripts/local-task-runner.mjs"), "utf8"))) addFinding(findings, "RUNNER_PHASE_GATE", "A descriptive phase change must not create a runner checkpoint.", "scripts/local-task-runner.mjs");
  if (hasFile("layout/GENERATE_TASKS.md")) {
    const taskLayout = fs.readFileSync(path.join(absoluteRoot, "layout/GENERATE_TASKS.md"), "utf8");
    if (!/2-3 total runner tasks by default/i.test(taskLayout) || !/5 only as an exceptional hard ceiling/i.test(taskLayout) || !/final integrated audit/i.test(taskLayout)) addFinding(findings, "TASK_GENERATOR_SLICE_POLICY", "Task generation must default to two or three outcomes, keep five exceptional, and include final integrated audit.", "layout/GENERATE_TASKS.md");
  }

  if (packageJson && hasFile("BASELINE.md") && hasFile("CHANGELOG.md")) {
    const baseline = fs.readFileSync(path.join(absoluteRoot, "BASELINE.md"), "utf8");
    const changelog = fs.readFileSync(path.join(absoluteRoot, "CHANGELOG.md"), "utf8");
    for (const finding of validateVersionContract(packageJson, baseline, changelog)) addFinding(findings, finding.code, finding.message, finding.code.includes("CHANGELOG") || finding.code.includes("UNRELEASED") ? "CHANGELOG.md" : finding.code.includes("PACKAGE") || finding.code.includes("PRIVATE") || finding.code.includes("SCRIPTS") || finding.code.includes("DEPENDENCIES") || finding.code.includes("ENGINE") || finding.code.includes("MODULE") || finding.code === "VERSION_SEMVER" ? "package.json" : "BASELINE.md");
  }

  for (const file of ["README.md", "docs/GETTING_STARTED.md", "docs/CONTRIBUTING.md"]) {
    if (hasFile(file) && /PRD Generator System/.test(fs.readFileSync(path.join(absoluteRoot, file), "utf8"))) addFinding(findings, "DOC_LEGACY_NAME", "Onboarding and maintenance documentation must use the canonical PRD Toolkit name.", file);
  }
  if (hasFile("README.md") && /\/tmp\/prd-toolkit-unzipped|\/Users\/tgl\/Project\/(?:ExamPrd|Mprd)\//.test(fs.readFileSync(path.join(absoluteRoot, "README.md"), "utf8"))) addFinding(findings, "DOC_PROVENANCE_OWNERSHIP", "Historical construction provenance belongs in the evidence synthesis, not README.md.", "README.md");

  if (hasFile(".gitignore")) {
    const ignoreEntries = new Set(fs.readFileSync(path.join(absoluteRoot, ".gitignore"), "utf8").split(/\r?\n/).filter(Boolean));
    for (const entry of [".DS_Store", "node_modules/", "coverage/", "*.log", ".prd/", "TASKS.json", "TASK_STATE.json", "runs/", "dist/", ".env", ".env.*"]) {
      if (!ignoreEntries.has(entry)) addFinding(findings, "BASELINE_GITIGNORE", `Repository baseline must ignore ${entry}.`, ".gitignore");
    }
  }

  if (hasFile("templates/full.md")) validateTemplate(absoluteRoot, "templates/full.md", "app", FULL_SECTIONS, findings);
  if (hasFile("templates/lite.md")) validateTemplate(absoluteRoot, "templates/lite.md", "tool", LITE_SECTIONS, findings);

  const reasonixCommands = validateReasonixAdapter(absoluteRoot, findings);
  const lifecycleOperations = validateLifecycleFlow(absoluteRoot, findings);

  for (const skillFile of ["SKILL.md", "prompts/SKILL.md"]) {
    if (!hasFile(skillFile)) continue;
    const skillSource = fs.readFileSync(path.join(absoluteRoot, skillFile), "utf8");
    const skillFrontmatter = parseFrontmatter(skillSource);
    for (const finding of skillFrontmatter.findings) addFinding(findings, `SKILL_${finding.code}`, finding.message, skillFile, finding.line);
    if (typeof skillFrontmatter.data.name !== "string" || typeof skillFrontmatter.data.description !== "string") {
      addFinding(findings, "SKILL_FRONTMATTER", "Skill frontmatter must contain name and description strings.", skillFile, 1);
    }
  }

  let qualityGateCount = 0;
  if (hasFile("prompts/PRD_GENERATOR_PROMPT.md")) {
    const generator = fs.readFileSync(path.join(absoluteRoot, "prompts/PRD_GENERATOR_PROMPT.md"), "utf8");
    const generatorLines = generator.split(/\r?\n/).length;
    if (generatorLines >= 500) addFinding(findings, "GENERATOR_LINE_BUDGET", `Generator prompt must stay under 500 lines; found ${generatorLines}.`, "prompts/PRD_GENERATOR_PROMPT.md");
    const qualitySection = generator.slice(generator.indexOf("## Quality Gates"), generator.indexOf("## Traceability Matrix"));
    qualityGateCount = (qualitySection.match(/^\d+\.\s/gm) ?? []).length;
    if (qualityGateCount < 14) addFinding(findings, "GENERATOR_QUALITY_GATES", `Generator prompt requires at least 14 quality gates; found ${qualityGateCount}.`, "prompts/PRD_GENERATOR_PROMPT.md");
  }

  const markdown = validateMarkdownFiles(absoluteRoot, findings);
  const archivedDocuments = validateArchive(absoluteRoot, findings);
  const synthesisSections = validateSynthesisStructure(absoluteRoot, findings);
  const failureClassifications = taskStateSchema && hasFile("prompts/RELIABILITY_GUIDE.md") && hasFile("scripts/local-task-runner.mjs") ? validateFailureTaxonomy(absoluteRoot, taskStateSchema, findings) : 0;
  const regressions = validateRegressionManifest(absoluteRoot, findings);
  findings.sort((left, right) => String(left.file).localeCompare(String(right.file)) || (left.line ?? 0) - (right.line ?? 0) || left.code.localeCompare(right.code));

  return {
    valid: findings.length === 0,
    kind: "prd-toolkit-structural-validation",
    root: absoluteRoot,
    version: packageJson?.version ?? null,
    source_state: sourceFingerprint(absoluteRoot, CANONICAL_PATHS),
    readiness_claim: "Level 1 — Unit verified structural contracts only",
    counts: {
      canonical_files: CANONICAL_PATHS.length,
      json_documents: Object.keys(parsedJson).length,
      markdown_files: markdown.files,
      local_links: markdown.links_checked,
      markdown_table_rows: markdown.table_rows_checked,
      markdown_fence_markers: markdown.fence_markers_checked,
      markdown_secret_lines: markdown.secret_lines_scanned,
      generator_quality_gates: qualityGateCount,
      failure_classifications: failureClassifications,
      reasonix_commands: reasonixCommands,
      lifecycle_operations: lifecycleOperations,
      regression_cases: regressions.total,
      regression_passed: regressions.passed,
      regression_failed: regressions.failed,
      archived_documents: archivedDocuments,
      synthesis_sections: synthesisSections,
      findings: findings.length,
    },
    limitations: [
      "No model is invoked; regression cases evaluate checked-in representative generator outputs and deterministic negative mutations.",
      "Subjective checklist scoring, factual product correctness, runtime evidence, and production readiness remain outside this validator.",
    ],
    regressions,
    findings,
  };
}

function renderText(result) {
  const output = [
    `${result.valid ? "PASS" : "FAIL"} ${result.root}`,
    `Version: ${result.version ?? "UNVERIFIED"}`,
    `Source state: ${result.source_state}`,
    `Canonical files=${result.counts.canonical_files}; JSON=${result.counts.json_documents}; Markdown=${result.counts.markdown_files}; links=${result.counts.local_links}; archived=${result.counts.archived_documents}; regression=${result.counts.regression_passed}/${result.counts.regression_cases}`,
    `Quality gates=${result.counts.generator_quality_gates}; failure classifications=${result.counts.failure_classifications}; Reasonix commands=${result.counts.reasonix_commands}; lifecycle operations=${result.counts.lifecycle_operations}; findings=${result.counts.findings}`,
  ];
  for (const finding of result.findings) output.push(`ERROR ${finding.code}${finding.file ? ` ${finding.file}` : ""}${finding.line ? `:${finding.line}` : ""}: ${finding.message}`);
  output.push(`Readiness: ${result.readiness_claim}`);
  output.push(`Limitations: ${result.limitations.join(" ")}`);
  return output.join("\n");
}

export function runCli(argv = process.argv.slice(2)) {
  if (argv.some((arg) => arg !== "--json")) {
    console.error("Usage: node scripts/validate-toolkit.mjs [--json]");
    return 2;
  }
  const result = validateToolkit();
  console.log(argv.includes("--json") ? JSON.stringify(result, null, 2) : renderText(result));
  return result.valid ? 0 : 1;
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = runCli();
