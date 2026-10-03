#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, validatePrd } from "./validate-prd.mjs";

// Extract existing content only. An agent supplies the conversational explanation;
// this helper never invents product behavior or marks an application implemented.
export function previewPrd(source, file) {
  const validation = validatePrd(source, { file });
  if (!validation.valid) return { valid: false, validation, markdown: null };
  const text = source.replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?(?:-->|$)/g, "");
  const metadata = parseFrontmatter(text).data;
  const sectionTitle = metadata.type === "app" ? "4. User Flow" : "3. Architecture & Data Flow";
  const lines = text.split("\n");
  let section = "";
  let overview = [];
  let collectingOverview = false;
  let fence = null;
  let diagram = null;
  for (const line of lines) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.marker[0] && marker[1].length >= fence.marker.length && !marker[2].trim()) {
        if (!diagram && fence.section === sectionTitle && fence.language === "mermaid" && /^\s*(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b/.test(fence.body.join("\n"))) {
          diagram = fence.body.join("\n");
        }
        fence = null;
      } else fence.body.push(line);
      continue;
    }
    if (marker) {
      fence = { marker: marker[1], language: marker[2].trim(), section, body: [] };
      continue;
    }
    if (/^#{1,6}\s/.test(line)) collectingOverview = false;
    if (line.startsWith("## ")) section = line.slice(3).trim();
    if (section === "1. Overview" && /^### Layer 1: Human PRD\s*$/.test(line)) collectingOverview = true;
    else if (collectingOverview) overview.push(line);
  }
  if (!diagram || !overview.join("\n").trim()) {
    return { valid: false, validation, markdown: null, error: "The PRD passes structural checks but needs a visible Human PRD overview and a product flowchart in its User Flow or Architecture & Data Flow section. Existing sequence-only PRDs remain valid; add a product flowchart to use this preview." };
  }
  const relativeName = path.basename(file ?? "PRD.md");
  const markdown = [
    `# ${metadata.project} — PRD preview`,
    `Source: [${relativeName}](${encodeURIComponent(relativeName)}). Template: ${validation.template}. PRD status: ${metadata.status}.`,
    "## Product overview",
    overview.join("\n").trim(),
    "## Product flow",
    "```mermaid\n" + diagram + "\n```",
    "## Verification and next step",
    `Structural preflight passed: ${validation.counts.requirements} requirements and ${validation.counts.acceptance_criteria} acceptance criteria. This does not prove product feasibility, Mermaid rendering, implementation or runtime behavior.`,
    "Review the saved scope, assumptions and milestones. To authorize implementation, give a fresh builder the PRD and say: Build this PRD until done. Verify the real user flow and finish with IMPLEMENTATION_AUDIT.md.",
  ].join("\n\n") + "\n";
  return { valid: true, validation, markdown };
}

export function runCli(args = process.argv.slice(2)) {
  try {
    if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Usage: node scripts/preview-prd.mjs <prd.md>");
    const file = path.resolve(args[0]);
    const result = previewPrd(fs.readFileSync(file, "utf8"), file);
    if (!result.valid) {
      console.error(result.error ?? result.validation.findings.map((f) => `${f.code}: ${f.message}`).join("\n"));
      return 1;
    }
    process.stdout.write(result.markdown);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 2;
  }
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runCli();
