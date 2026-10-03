#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAuthorityPolicy, AUTHORITY_FORMAT_LIMIT } from "./authority-policy.mjs";

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

const VALID_STATUSES = new Set(["draft", "implementation", "approved", "superseded"]);
const VALID_MILESTONE_STATUSES = new Set([
  "⬜ Not Started",
  "🔄 In Progress",
  "✅ Verified",
  "✅ Approved",
]);

const ID_PATTERN = /\b(?:FR|NFR|AC)-[0-9A-Za-z]+\b/g;
const CANDIDATE_ID_PATTERN = /\b(?:FR|NFR|AC)(?:[-_][A-Za-z0-9]+|[0-9]+)\b/g;
const REQUIREMENT_ID_PATTERN = /^(?:FR|NFR)-\d{3}$/;
const ACCEPTANCE_ID_PATTERN = /^AC-\d{3}$/;

function unique(values) {
  return [...new Set(values)];
}

function extractIds(value, matcher) {
  return unique((String(value).match(ID_PATTERN) ?? []).filter((id) => matcher.test(id)));
}

function parseScalar(raw, line, findings) {
  const value = raw.trim();
  if (value === "") return "";
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value.startsWith('"') || value.startsWith("'")) {
    if (value[0] !== value.at(-1)) {
      findings.push({
        code: "FM_YAML_SYNTAX",
        severity: "blocker",
        message: "Frontmatter contains an unterminated quoted scalar.",
        line,
      });
      return value;
    }
    if (value.startsWith('"')) {
      try {
        return JSON.parse(value);
      } catch {
        findings.push({
          code: "FM_YAML_SYNTAX",
          severity: "blocker",
          message: "Frontmatter contains an invalid double-quoted scalar.",
          line,
        });
        return value;
      }
    }
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

export function parseFrontmatter(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const findings = [];
  if (lines[0] !== "---") {
    findings.push({
      code: "FM_MISSING",
      severity: "blocker",
      message: "YAML frontmatter must begin on line 1.",
      line: 1,
    });
    return { data: {}, endLine: 0, findings };
  }

  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex < 0) {
    findings.push({
      code: "FM_UNCLOSED",
      severity: "blocker",
      message: "YAML frontmatter has no closing delimiter.",
      line: 1,
    });
    return { data: {}, endLine: 0, findings };
  }

  const data = {};
  let activeListKey = null;
  for (let index = 1; index < closingIndex; index += 1) {
    const raw = lines[index];
    const line = index + 1;
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) continue;

    const listMatch = raw.match(/^\s{2}-\s+(.+)$/);
    if (listMatch && activeListKey) {
      data[activeListKey].push(parseScalar(listMatch[1], line, findings));
      continue;
    }

    const keyMatch = raw.match(/^([A-Za-z_][A-Za-z0-9_]*):(?:\s*(.*))?$/);
    if (!keyMatch) {
      findings.push({
        code: "FM_YAML_SYNTAX",
        severity: "blocker",
        message: "Frontmatter uses unsupported or malformed YAML syntax.",
        line,
      });
      activeListKey = null;
      continue;
    }

    const [, key, scalar = ""] = keyMatch;
    if (Object.hasOwn(data, key)) {
      findings.push({
        code: "FM_DUPLICATE_KEY",
        severity: "blocker",
        message: `Frontmatter key ${key} is duplicated.`,
        line,
      });
      activeListKey = null;
      continue;
    }

    if (scalar.trim() === "") {
      data[key] = [];
      activeListKey = key;
    } else {
      data[key] = parseScalar(scalar, line, findings);
      activeListKey = null;
    }
  }

  return { data, endLine: closingIndex + 1, findings };
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
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isDelimiterRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTables(lines) {
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = splitTableRow(lines[index]);
    const delimiter = splitTableRow(lines[index + 1]);
    if (header.length < 2 || delimiter.length !== header.length || !isDelimiterRow(delimiter)) continue;

    const rows = [];
    let cursor = index + 2;
    while (cursor < lines.length) {
      const cells = splitTableRow(lines[cursor]);
      if (cells.length === 0) break;
      rows.push({ cells, line: cursor + 1 });
      cursor += 1;
    }
    tables.push({ header, rows, line: index + 1 });
    index = cursor - 1;
  }
  return tables;
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function addSetDifferenceFindings(findings, actual, expected, code, label, line) {
  const missing = [...expected].filter((id) => !actual.has(id)).sort();
  const extra = [...actual].filter((id) => !expected.has(id)).sort();
  if (missing.length === 0 && extra.length === 0) return;
  const details = [];
  if (missing.length) details.push(`missing ${missing.join(", ")}`);
  if (extra.length) details.push(`unknown ${extra.join(", ")}`);
  findings.push({
    code,
    severity: "blocker",
    message: `${label} set coverage is incomplete: ${details.join("; ")}.`,
    line,
  });
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateFrontmatter(frontmatter, expectedType, findings) {
  const actualKeys = Object.keys(frontmatter);
  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!Object.hasOwn(frontmatter, key)) {
      findings.push({
        code: "FM_REQUIRED_KEY",
        severity: "blocker",
        message: `Frontmatter is missing required key ${key}.`,
        line: 1,
      });
    }
  }
  for (const key of actualKeys) {
    if (!REQUIRED_FRONTMATTER_KEYS.includes(key) && key !== "authority_policy") {
      findings.push({
        code: "FM_ADDITIONAL_KEY",
        severity: "blocker",
        message: `Frontmatter key ${key} is not allowed by the canonical schema.`,
        line: 1,
      });
    }
  }

  if (typeof frontmatter.project !== "string" || frontmatter.project.trim() === "") {
    findings.push({ code: "FM_PROJECT", severity: "blocker", message: "project must be a non-empty string.", line: 1 });
  }
  if (typeof frontmatter.version !== "string" || !/^\d+\.\d+\.\d+$/.test(frontmatter.version)) {
    findings.push({ code: "FM_VERSION", severity: "blocker", message: "version must use semantic x.y.z form.", line: 1 });
  }
  if (!VALID_STATUSES.has(frontmatter.status)) {
    findings.push({ code: "FM_STATUS", severity: "blocker", message: "status must be draft, implementation, approved, or superseded.", line: 1 });
  }
  if (!Number.isInteger(frontmatter.current_milestone) || frontmatter.current_milestone < 0) {
    findings.push({ code: "FM_CURRENT_MILESTONE", severity: "blocker", message: "current_milestone must be an integer at least 0.", line: 1 });
  }
  if (!Number.isInteger(frontmatter.total_milestones) || frontmatter.total_milestones < 1) {
    findings.push({ code: "FM_TOTAL_MILESTONES", severity: "blocker", message: "total_milestones must be an integer at least 1.", line: 1 });
  }
  if (
    Number.isInteger(frontmatter.current_milestone) &&
    Number.isInteger(frontmatter.total_milestones) &&
    frontmatter.current_milestone > frontmatter.total_milestones
  ) {
    findings.push({ code: "FM_MILESTONE_RANGE", severity: "blocker", message: "current_milestone cannot exceed total_milestones.", line: 1 });
  }
  if (frontmatter.status === "draft" && frontmatter.current_milestone !== 0) {
    findings.push({ code: "FM_DRAFT_STATE", severity: "blocker", message: "A draft PRD must use current_milestone: 0.", line: 1 });
  }
  if (!new Set(["app", "tool"]).has(frontmatter.type)) {
    findings.push({ code: "FM_TYPE", severity: "blocker", message: "type must be app or tool.", line: 1 });
  }
  if (expectedType && frontmatter.type !== expectedType) {
    findings.push({
      code: "FM_EXPECTED_TYPE",
      severity: "blocker",
      message: `Expected type ${expectedType}, but frontmatter declares ${String(frontmatter.type)}.`,
      line: 1,
    });
  }
  if (!Array.isArray(frontmatter.tech_stack) || frontmatter.tech_stack.length === 0 || frontmatter.tech_stack.some((item) => typeof item !== "string" || item.trim() === "")) {
    findings.push({ code: "FM_TECH_STACK", severity: "blocker", message: "tech_stack must contain at least one non-empty string.", line: 1 });
  }
  if (typeof frontmatter.created !== "string" || !isRealDate(frontmatter.created)) {
    findings.push({ code: "FM_CREATED", severity: "blocker", message: "created must be a real YYYY-MM-DD date.", line: 1 });
  }
  if (typeof frontmatter.ai_instructions !== "string" || frontmatter.ai_instructions.trim() === "") {
    findings.push({ code: "FM_AI_INSTRUCTIONS", severity: "blocker", message: "ai_instructions must be a non-empty string.", line: 1 });
  }
}

function validateSections(lines, type, findings) {
  const expected = type === "tool" ? LITE_SECTIONS : FULL_SECTIONS;
  const found = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^##\s+(\d+)\.\s+(.+?)\s*$/);
    if (match) found.push({ number: Number(match[1]), title: match[2], line: index + 1 });
  }
  if (found.length !== expected.length) {
    findings.push({
      code: "STRUCT_SECTION_COUNT",
      severity: "blocker",
      message: `${type === "tool" ? "Lite" : "Full"} PRD requires exactly ${expected.length} numbered top-level sections; found ${found.length}.`,
      line: found[0]?.line ?? 1,
    });
  }
  expected.forEach((title, index) => {
    const section = found[index];
    if (!section || section.number !== index + 1 || section.title !== title) {
      findings.push({
        code: "STRUCT_SECTION_ORDER",
        severity: "blocker",
        message: `Section ${index + 1} must be exactly "${title}".`,
        line: section?.line ?? 1,
      });
    }
  });
  return found;
}

function validateFencesAndMermaid(lines, findings) {
  let open = null;
  let mermaidCount = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*```\s*([A-Za-z0-9_-]*)\s*$/);
    if (!match) {
      if (open) open.content.push(lines[index]);
      continue;
    }
    if (!open) {
      open = { language: match[1], line: index + 1, content: [] };
      continue;
    }
    if (match[1] !== "") {
      findings.push({
        code: "MARKDOWN_FENCE_NESTED",
        severity: "blocker",
        message: "A code fence was opened before the prior fence was closed.",
        line: index + 1,
      });
      continue;
    }
    if (open.language === "mermaid") {
      mermaidCount += 1;
      const first = open.content.map((line) => line.trim()).find((line) => line && !line.startsWith("%%"));
      if (!first || !/^(?:graph|flowchart|sequenceDiagram|erDiagram|stateDiagram-v2|classDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|C4)\b/.test(first)) {
        findings.push({
          code: "MERMAID_DIRECTIVE",
          severity: "blocker",
          message: "Mermaid block does not begin with a supported diagram directive.",
          line: open.line,
        });
      }
    }
    open = null;
  }
  if (open) {
    findings.push({ code: "MARKDOWN_FENCE_UNCLOSED", severity: "blocker", message: "A Markdown code fence is not closed.", line: open.line });
  }
  if (mermaidCount === 0) {
    findings.push({ code: "MERMAID_MISSING", severity: "blocker", message: "The PRD must contain at least one Mermaid diagram.", line: 1 });
  }
  return mermaidCount;
}

function validatePlaceholders(lines, findings) {
  const placeholder = /\b(?:TBD|TODO|TO BE DECIDED)\b|\[(?:Project Name|Tool or Automation Name|Technology|Requirement|Feature|Capability|Milestone(?: name)?|Concrete proof|Test\/receipt|How measured|Component|Purpose|Path)\]/i;
  lines.forEach((line, index) => {
    if (placeholder.test(line)) {
      findings.push({
        code: "CONTENT_PLACEHOLDER",
        severity: "blocker",
        message: "Unresolved placeholder or decision marker remains in the PRD.",
        line: index + 1,
      });
    }
  });
}

function validateSecrets(lines, findings) {
  const directPatterns = [
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bsk-[A-Za-z0-9_-]{16,}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}={0,2}\b/i,
  ];
  const assignment = /["']?(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)["']?\s*[:=]\s*["']?([^\s"',}]+)/i;
  lines.forEach((line, index) => {
    let exposed = directPatterns.some((pattern) => pattern.test(line));
    const match = line.match(assignment);
    if (match) {
      const value = match[1];
      const safeReference = /^(?:<|\[|\$\{|process\.env|env\b|redacted\b|example\b|generated\b|credential\b|UNVERIFIED\b)/i.test(value);
      if (!safeReference && value.length >= 8) exposed = true;
    }
    if (exposed) {
      findings.push({
        code: "SECRET_EXPOSED",
        severity: "blocker",
        message: "A value resembling a credential or private key appears directly in the PRD.",
        line: index + 1,
      });
    }
  });
}

function validateLocalLinks(source, file, findings) {
  if (!file) return 0;
  const absoluteFile = path.resolve(file);
  let checked = 0;
  const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of source.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    try {
      target = decodeURIComponent(target.split("#")[0]);
    } catch {
      findings.push({
        code: "LINK_LOCAL_ENCODING",
        severity: "blocker",
        message: "A local Markdown link contains invalid percent encoding.",
        line: source.slice(0, match.index).split("\n").length,
      });
      continue;
    }
    if (target === "") continue;
    const targetPath = path.isAbsolute(target) ? target : path.resolve(path.dirname(absoluteFile), target);
    checked += 1;
    if (!fs.existsSync(targetPath)) {
      findings.push({
        code: "LINK_LOCAL_MISSING",
        severity: "blocker",
        message: `Local Markdown link target does not exist: ${target}.`,
        line: source.slice(0, match.index).split("\n").length,
      });
    }
  }
  return checked;
}

function validateIdsAndTraceability(lines, tables, findings) {
  const malformed = new Map();
  lines.forEach((line, index) => {
    for (const id of line.match(CANDIDATE_ID_PATTERN) ?? []) {
      if (!REQUIREMENT_ID_PATTERN.test(id) && !ACCEPTANCE_ID_PATTERN.test(id) && !malformed.has(id)) malformed.set(id, index + 1);
    }
  });
  for (const [id, line] of malformed) {
    findings.push({ code: "ID_MALFORMED", severity: "blocker", message: `${id} is not a well-formed FR-###, NFR-###, or AC-### ID.`, line });
  }

  const requirementDefinitions = new Map();
  const acceptanceDefinitions = new Map();
  const requirementPairs = new Set();
  const acceptancePairs = new Set();

  for (const table of tables) {
    const normalized = table.header.map((cell) => cell.toLowerCase());
    const idIndex = normalized.indexOf("id");
    const requirementIdsIndex = normalized.indexOf("requirement ids");
    const acceptanceIdsIndex = normalized.indexOf("acceptance criteria ids");
    const requirementTable = idIndex === 0 && acceptanceIdsIndex >= 0 && normalized.includes("requirement");
    const acceptanceTable = idIndex === 0 && requirementIdsIndex >= 0 && normalized.some((cell) => cell.includes("observable criterion"));

    if (requirementTable) {
      for (const row of table.rows) {
        if (row.cells.length !== table.header.length || row.cells.some((cell) => !cell.trim())) {
          findings.push({ code: "REQ_ROW_INCOMPLETE", severity: "blocker", message: "Requirement rows must contain every declared cell and non-empty requirement text.", line: row.line });
        }
        const id = row.cells[idIndex];
        if (!REQUIREMENT_ID_PATTERN.test(id)) continue;
        if (requirementDefinitions.has(id)) {
          findings.push({ code: "ID_DUPLICATE", severity: "blocker", message: `Requirement ${id} is defined more than once.`, line: row.line });
        } else requirementDefinitions.set(id, row.line);
        const acIds = extractIds(row.cells[acceptanceIdsIndex] ?? "", ACCEPTANCE_ID_PATTERN);
        if (acIds.length === 0) {
          findings.push({ code: "REQ_WITHOUT_AC", severity: "blocker", message: `Requirement ${id} has no acceptance-criteria reference.`, line: row.line });
        }
        acIds.forEach((acId) => requirementPairs.add(`${id}|${acId}`));
      }
    }

    if (acceptanceTable) {
      for (const row of table.rows) {
        if (row.cells.length !== table.header.length || row.cells.some((cell) => !cell.trim())) {
          findings.push({ code: "AC_ROW_INCOMPLETE", severity: "blocker", message: "Acceptance rows must contain every declared cell, observable criterion, and evidence.", line: row.line });
        }
        const id = row.cells[idIndex];
        if (!ACCEPTANCE_ID_PATTERN.test(id)) continue;
        if (acceptanceDefinitions.has(id)) {
          findings.push({ code: "ID_DUPLICATE", severity: "blocker", message: `Acceptance criterion ${id} is defined more than once.`, line: row.line });
        } else acceptanceDefinitions.set(id, row.line);
        const requirementIds = extractIds(row.cells[requirementIdsIndex] ?? "", REQUIREMENT_ID_PATTERN);
        if (requirementIds.length === 0) {
          findings.push({ code: "AC_WITHOUT_REQ", severity: "blocker", message: `Acceptance criterion ${id} has no requirement reference.`, line: row.line });
        }
        requirementIds.forEach((requirementId) => acceptancePairs.add(`${requirementId}|${id}`));
      }
    }
  }

  if (requirementDefinitions.size === 0) {
    findings.push({ code: "REQ_MISSING", severity: "blocker", message: "No FR-### or NFR-### definitions were found in requirement tables.", line: 1 });
  }
  if (acceptanceDefinitions.size === 0) {
    findings.push({ code: "AC_MISSING", severity: "blocker", message: "No AC-### definitions were found in acceptance-criteria tables.", line: 1 });
  }

  for (const pair of requirementPairs) {
    const [requirementId, acceptanceId] = pair.split("|");
    if (!acceptanceDefinitions.has(acceptanceId)) {
      findings.push({ code: "REQ_UNKNOWN_AC", severity: "blocker", message: `${requirementId} references undefined ${acceptanceId}.`, line: requirementDefinitions.get(requirementId) ?? 1 });
    }
    if (!acceptancePairs.has(pair)) {
      findings.push({ code: "TRACE_PAIR_MISMATCH", severity: "blocker", message: `${requirementId} → ${acceptanceId} is not mapped back from the acceptance criterion.`, line: requirementDefinitions.get(requirementId) ?? 1 });
    }
  }
  for (const pair of acceptancePairs) {
    const [requirementId, acceptanceId] = pair.split("|");
    if (!requirementDefinitions.has(requirementId)) {
      findings.push({ code: "AC_UNKNOWN_REQ", severity: "blocker", message: `${acceptanceId} references undefined ${requirementId}.`, line: acceptanceDefinitions.get(acceptanceId) ?? 1 });
    }
    if (!requirementPairs.has(pair)) {
      findings.push({ code: "TRACE_PAIR_MISMATCH", severity: "blocker", message: `${acceptanceId} → ${requirementId} is not mapped back from the requirement.`, line: acceptanceDefinitions.get(acceptanceId) ?? 1 });
    }
  }

  const traceTable = tables.find((table) => {
    const headers = table.header.map((cell) => cell.toLowerCase());
    return (headers.includes("feature") || headers.includes("capability")) && headers.includes("fr/nfr ids") && headers.includes("ac ids") && headers.includes("required evidence");
  });
  if (!traceTable) {
    findings.push({ code: "TRACE_MATRIX_MISSING", severity: "blocker", message: "No canonical traceability matrix was found.", line: 1 });
    return { requirements: requirementDefinitions.size, acceptanceCriteria: acceptanceDefinitions.size, traceRows: 0 };
  }

  const headers = traceTable.header.map((cell) => cell.toLowerCase());
  const reqIndex = headers.indexOf("fr/nfr ids");
  const acIndex = headers.indexOf("ac ids");
  const traceRequirements = new Set();
  const traceAcceptance = new Set();
  for (const row of traceTable.rows) {
    if (row.cells.length !== traceTable.header.length) {
      findings.push({ code: "TRACE_COLUMN_COUNT", severity: "blocker", message: "Traceability row has the wrong number of cells.", line: row.line });
      continue;
    }
    row.cells.forEach((cell, index) => {
      if (cell.trim() === "") {
        findings.push({ code: "TRACE_EMPTY_CELL", severity: "blocker", message: `Traceability cell ${traceTable.header[index]} is empty.`, line: row.line });
      } else if (/^N\/A\b/i.test(cell) && !/^N\/A\s+-\s+\S.+/i.test(cell)) {
        findings.push({ code: "TRACE_INVALID_NA", severity: "blocker", message: "Traceability N/A values require a specific reason.", line: row.line });
      }
    });
    extractIds(row.cells[reqIndex] ?? "", REQUIREMENT_ID_PATTERN).forEach((id) => traceRequirements.add(id));
    extractIds(row.cells[acIndex] ?? "", ACCEPTANCE_ID_PATTERN).forEach((id) => traceAcceptance.add(id));
  }

  const requiredSet = new Set(requirementDefinitions.keys());
  const acceptanceSet = new Set(acceptanceDefinitions.keys());
  if (!sameSet(traceRequirements, requiredSet)) addSetDifferenceFindings(findings, traceRequirements, requiredSet, "TRACE_REQUIREMENT_COVERAGE", "Requirement", traceTable.line);
  if (!sameSet(traceAcceptance, acceptanceSet)) addSetDifferenceFindings(findings, traceAcceptance, acceptanceSet, "TRACE_AC_COVERAGE", "Acceptance-criteria", traceTable.line);

  return {
    requirements: requirementDefinitions.size,
    acceptanceCriteria: acceptanceDefinitions.size,
    traceRows: traceTable.rows.length,
  };
}

function validateMilestones(tables, frontmatter, findings) {
  const milestoneTables = tables.filter((table) => {
    const headers = table.header.map((cell) => cell.toLowerCase());
    return headers.includes("#") && headers.includes("milestone") && headers.includes("done when") && headers.includes("status");
  });
  if (milestoneTables.length === 0) {
    findings.push({ code: "MILESTONE_TABLE_MISSING", severity: "blocker", message: "No outcome-oriented milestone table with Done When evidence was found.", line: 1 });
    return 0;
  }

  for (const table of milestoneTables) {
    const headers = table.header.map((cell) => cell.toLowerCase());
    const numberIndex = headers.indexOf("#");
    const doneIndex = headers.indexOf("done when");
    const statusIndex = headers.indexOf("status");
    const numbers = [];
    if (table.rows.length > 5) {
      findings.push({
        code: "MILESTONE_SLICE_BUDGET",
        severity: "blocker",
        message: "One implementation plan may define at most five outcome-oriented milestones including final integrated audit; use two or three by default and move a separate program into another plan.",
        line: table.line,
      });
    }
    for (const row of table.rows) {
      const number = Number(row.cells[numberIndex]);
      numbers.push(number);
      if (!Number.isInteger(number) || number < 1) {
        findings.push({ code: "MILESTONE_NUMBER", severity: "blocker", message: "Milestone numbers must be positive integers.", line: row.line });
      }
      if (!row.cells[doneIndex]?.trim()) {
        findings.push({ code: "MILESTONE_DONE_WHEN", severity: "blocker", message: "Every milestone requires non-empty Done When evidence.", line: row.line });
      }
      if (!VALID_MILESTONE_STATUSES.has(row.cells[statusIndex])) {
        findings.push({ code: "MILESTONE_STATUS", severity: "blocker", message: "Milestone status must use a canonical status indicator.", line: row.line });
      }
    }
    numbers.forEach((number, index) => {
      if (number !== index + 1) {
        findings.push({ code: "MILESTONE_SEQUENCE", severity: "blocker", message: "Milestone rows must be sequential from 1.", line: table.rows[index]?.line ?? table.line });
      }
    });
    if (Number.isInteger(frontmatter.total_milestones) && table.rows.length !== frontmatter.total_milestones) {
      findings.push({
        code: "MILESTONE_TOTAL_MISMATCH",
        severity: "blocker",
        message: `Milestone table has ${table.rows.length} rows but frontmatter declares ${frontmatter.total_milestones}.`,
        line: table.line,
      });
    }
  }

  return milestoneTables[0].rows.length;
}

// Keep line numbers while excluding examples and comments from the live contract.
// This is a bounded Markdown scan, not a complete Markdown renderer.
function contractLines(source) {
  const uncommented = source.replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) => comment.replace(/[^\n]/g, " "));
  let fence = null;
  return uncommented.split("\n").map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return "";
    }
    if (marker) {
      fence = marker[1];
      return "";
    }
    return line;
  });
}

function validateBuilderCapabilityRouting(source, type, findings) {
  const expected = [
    "trigger",
    "required capability",
    "preferred skill/tool if available",
    "fallback if unavailable",
    "required evidence",
    "authority",
  ];
  const lines = contractLines(source);
  const headings = lines.flatMap((line, index) => /^###\s+Builder Capability Routing Contract\s*$/.test(line) ? [index] : []);
  if (headings.length !== 1) {
    findings.push({ code: "BUILDER_ROUTING_MISSING", severity: "blocker", message: "The PRD must contain exactly one visible Builder Capability Routing Contract subsection.", line: headings[0] + 1 || 1 });
    return;
  }
  const start = headings[0];
  const parent = lines.slice(0, start).filter((line) => /^##\s+/.test(line)).at(-1);
  const expectedParent = type === "tool" ? "## 3. Architecture & Data Flow" : "## 5. Architecture";
  if (parent?.trim() !== expectedParent) {
    findings.push({ code: "BUILDER_ROUTING_LOCATION", severity: "blocker", message: "Builder routing must be inside the selected template's Architecture section.", line: start + 1 });
  }
  const nextHeading = lines.findIndex((line, index) => index > start && /^#{1,3}\s+/.test(line));
  const end = nextHeading < 0 ? lines.length : nextHeading;
  const contract = lines.slice(start, end).join("\n");
  const tables = parseTables(lines).filter((table) => table.line > start && table.line <= end);
  const matchingTables = tables.filter((candidate) => {
    const normalized = candidate.header.map((cell) => cell.toLowerCase());
    return normalized.length === expected.length && expected.every((header) => normalized.includes(header));
  });
  if (matchingTables.length !== 1) {
    findings.push({
      code: "BUILDER_ROUTING_MISSING",
      severity: "blocker",
      message: "The builder routing subsection must contain exactly one table with the six canonical columns: trigger, capability, preferred available route, fallback, evidence, and authority.",
      line: start + 1,
    });
    return;
  }
  const table = matchingTables[0];
  if (table.rows.length === 0) {
    findings.push({ code: "BUILDER_ROUTING_EMPTY", severity: "blocker", message: "Builder Capability Routing Contract must contain at least one project-specific route.", line: table.line });
  }
  for (const row of table.rows) {
    if (row.cells.length !== table.header.length || row.cells.some((cell) => cell.trim() === "")) {
      findings.push({ code: "BUILDER_ROUTING_ROW", severity: "blocker", message: "Every builder capability route requires all six non-empty cells.", line: row.line });
    }
    if (row.cells.some((cell) => /^(?:\[[^\]]+\]|N\/A|none|unknown|UNAVAILABLE|[-—])$/i.test(cell.replace(/`/g, "").trim()))) {
      findings.push({ code: "BUILDER_ROUTING_UNRESOLVED", severity: "blocker", message: "Builder routes cannot contain template placeholders or bare missing-value markers; provide a concrete route, a reasoned N/A for an optional preference, or a specific blocker and recovery action.", line: row.line });
    }
  }
  if (!/inspect\s+the\s+host-provided\s+available\s+skill\/tool\s+catalog/i.test(contract) || !/\bUNAVAILABLE\b/.test(contract)) {
    findings.push({
      code: "BUILDER_ROUTING_AVAILABILITY",
      severity: "blocker",
      message: "The builder routing contract must require host capability inspection and mark a preferred missing route UNAVAILABLE rather than assuming it exists.",
      line: table.line,
    });
  }
}

function validateCoreContent(source, type, findings) {
  if (!/Layer 1:\s*Human PRD/i.test(source) || !/Layer 2:\s*Machine Spec/i.test(source)) {
    findings.push({ code: "TWO_LAYER_MISSING", severity: "blocker", message: "The PRD must visibly separate Layer 1: Human PRD and Layer 2: Machine Spec.", line: 1 });
  }
  if (!/^###\s+Review Focus\s*$/m.test(source)) {
    findings.push({ code: "REVIEW_FOCUS_MISSING", severity: "error", message: "Generated PRD must include section-level Review Focus questions.", line: 1 });
  }
  validateBuilderCapabilityRouting(source, type, findings);
}

function sortFindings(findings) {
  const rank = { blocker: 0, error: 1, warning: 2 };
  return findings.sort((left, right) => (left.line ?? 0) - (right.line ?? 0) || rank[left.severity] - rank[right.severity] || left.code.localeCompare(right.code) || left.message.localeCompare(right.message));
}

export function validatePrd(source, options = {}) {
  const normalized = source.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const parsed = parseFrontmatter(normalized);
  const findings = [...parsed.findings];
  validateFrontmatter(parsed.data, options.expectedType, findings);
  if (typeof parsed.data.ai_instructions === "string" && parsed.data.ai_instructions.startsWith("#")) {
    const headings = new Set(contractLines(normalized).flatMap((line) => {
      const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
      return match ? ["#" + match[1].toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, "").trim().replace(/\s/g, "-")] : [];
    }));
    if (!headings.has(parsed.data.ai_instructions)) findings.push({ code: "FM_AI_INSTRUCTIONS_TARGET", severity: "blocker", message: "ai_instructions points to a missing or hidden local heading.", line: 1 });
  }
  const type = parsed.data.type === "tool" ? "tool" : "app";
  const visibleLines = contractLines(normalized);
  const visibleSource = visibleLines.join("\n");
  const sections = validateSections(visibleLines, type, findings);
  validatePlaceholders(lines, findings);
  validateSecrets(lines, findings);
  const localLinks = validateLocalLinks(normalized, options.file, findings);
  const mermaid = validateFencesAndMermaid(lines, findings);
  const tables = parseTables(visibleLines);
  const coverage = validateIdsAndTraceability(visibleLines, tables, findings);
  findings.push(...checkAuthorityPolicy(visibleSource, parsed.data));
  const milestones = validateMilestones(tables, parsed.data, findings);
  validateCoreContent(visibleSource, type, findings);

  const ordered = sortFindings(findings);
  const blockers = ordered.filter((finding) => finding.severity === "blocker").length;
  const errors = ordered.filter((finding) => finding.severity === "error").length;
  const warnings = ordered.filter((finding) => finding.severity === "warning").length;
  return {
    valid: blockers === 0 && errors === 0,
    kind: "generated-prd-structural-validation",
    file: options.file ?? null,
    detected_type: type,
    template: type === "tool" ? "Lite" : "Full",
    counts: {
      sections: sections.length,
      requirements: coverage.requirements,
      acceptance_criteria: coverage.acceptanceCriteria,
      traceability_rows: coverage.traceRows,
      mermaid_diagrams: mermaid,
      local_links: localLinks,
      milestones,
      blockers,
      errors,
      warnings,
    },
    limitations: [
      "This validator proves deterministic structure and traceability only.",
      AUTHORITY_FORMAT_LIMIT,
      "Product correctness, feasibility, evidence truth, and checklist scoring still require evidence-based human or agent review.",
      "Routing checks validate visible contract structure, not live tool availability, fallback equivalence, or successful builder execution.",
    ],
    findings: ordered,
  };
}

function usage() {
  return `Usage: node scripts/validate-prd.mjs <prd.md> [--expect-type app|tool] [--json]
       node scripts/validate-prd.mjs --help | -h | --version

Deterministic structural validation; no model generation or authorization check.
Exit codes: 0 valid (warnings allowed); 1 validation failed; 2 usage or input error.`;
}

function parseArgs(argv) {
  const parsed = { json: false, expectedType: null, file: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") parsed.json = true;
    else if (arg === "--expect-type") {
      const value = argv[index + 1];
      if (!new Set(["app", "tool"]).has(value)) throw new Error("--expect-type must be app or tool");
      parsed.expectedType = value;
      index += 1;
    } else if (arg.startsWith("--") || arg === "-h") throw new Error(`Unknown option ${arg}`);
    else if (parsed.file) throw new Error("Exactly one PRD path is allowed");
    else parsed.file = arg;
  }
  if (!parsed.file) throw new Error("A PRD path is required");
  return parsed;
}

function renderText(result) {
  const status = result.valid ? "PASS" : "FAIL";
  const output = [
    `${status} ${result.file}`,
    `Template: ${result.template}; sections=${result.counts.sections}; requirements=${result.counts.requirements}; acceptance_criteria=${result.counts.acceptance_criteria}; traceability_rows=${result.counts.traceability_rows}; mermaid=${result.counts.mermaid_diagrams}; milestones=${result.counts.milestones}`,
    `Findings: blockers=${result.counts.blockers}; errors=${result.counts.errors}; warnings=${result.counts.warnings}`,
  ];
  for (const finding of result.findings) {
    output.push(`${finding.severity.toUpperCase()} ${finding.code}${finding.line ? ` line ${finding.line}` : ""}: ${finding.message}`);
  }
  output.push(`Limitation: ${result.limitations.join(" ")}`);
  return output.join("\n");
}

export function runCli(argv = process.argv.slice(2)) {
  if (argv.length === 1 && ["--help", "-h", "--version"].includes(argv[0])) {
    console.log(argv[0] === "--version"
      ? JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version
      : usage());
    return 0;
  }
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n${usage()}`);
    return 2;
  }

  const absolutePath = path.resolve(args.file);
  let stat;
  try {
    stat = fs.statSync(absolutePath);
  } catch (error) {
    console.error(`Cannot read ${absolutePath}: ${error.message}`);
    return 2;
  }
  if (!stat.isFile()) {
    console.error(`${absolutePath} is not a file`);
    return 2;
  }
  if (stat.size > 2 * 1024 * 1024) {
    console.error(`${absolutePath} exceeds the 2 MiB validation budget`);
    return 2;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const result = validatePrd(source, { expectedType: args.expectedType, file: absolutePath });
  console.log(args.json ? JSON.stringify(result, null, 2) : renderText(result));
  return result.valid ? 0 : 1;
}

const isMain = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = runCli();
