#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OPERATIONS = {
  discover: "DISCOVER_PRODUCT.md",
  generate: "GENERATE_PRD.md",
  review: "VALIDATE_PRD.md",
  improve: "IMPROVE_PRD.md",
  build: "EXECUTE_TASKS.md",
  audit: "AUDIT_IMPLEMENTATION.md",
};
const COMMANDS = {
  validate: "validate-prd.mjs",
  compare: "compare-prd.mjs",
  preview: "preview-prd.mjs",
  check: "validate-toolkit.mjs",
  evaluate: "evaluate.mjs",
};
const HELP = `PRD Toolkit — portable specifications and reproducible checks

Usage: node scripts/prd.mjs <command> [arguments]

  context <operation>   Print instructions to attach/paste into any coding assistant
    --type app|tool     Select Full/Lite; omitted includes both for the agent to choose
    --change            Include existing-product and bug-fix contracts
    --reliability       Include detailed state/provider/recovery guidance
    --out <new.md>      Save a new packet; existing files are never overwritten
  validate <prd.md> [--json] [--expect-type app|tool]
  compare <old.md> <new.md> [--json] [--fail-on-removal]
  preview <prd.md>
  check [--json]
  evaluate <case.json> [--json] -- <executable> [arguments]

Operations: ${Object.keys(OPERATIONS).join(", ")}
Context preparation does not call a model, generate a PRD, or authorize a build.
Attach your brief/current PRD separately. Follow the requested operation only.
Evaluation runs the supplied trusted program against fixed input/output cases.
No provider, API key, package installation, or host configuration is required.
Existing scripts and their exit codes remain supported.`;

export function contextPacket(operation, { type, change = false, reliability = false, root = ROOT } = {}) {
  if (!Object.hasOwn(OPERATIONS, operation)) throw new Error(`Unknown operation: ${operation}`);
  if (type !== undefined && !["app", "tool"].includes(type)) throw new Error("--type must be app or tool");
  const files = ["SKILL.md", `layout/${OPERATIONS[operation]}`];
  if (["generate", "improve"].includes(operation)) {
    files.push("prompts/PRD_GENERATOR_PROMPT.md");
    if (type !== "tool") files.push("templates/full.md");
    if (type !== "app") files.push("templates/lite.md");
    files.push("templates/project-progress.md", "templates/project-decisions.md");
  }
  if (["generate", "review", "improve"].includes(operation)) {
    files.push("prompts/PRD_VALIDATION_CHECKLIST.md", "schemas/prd-frontmatter.schema.json", "docs/AUTHORITY_POLICY.md");
  }
  if (["discover", "generate", "improve"].includes(operation)) files.push("prompts/RESEARCH_AND_TOOL_ROUTING.md");
  if (change || operation === "improve") files.push("docs/CHANGE_CONTRACT.md");
  if (reliability) files.push("prompts/RELIABILITY_GUIDE.md");
  const sources = [...new Set(files)].map(file => {
    const content = fs.readFileSync(path.join(root, file), "utf8");
    return { file, content, sha256: crypto.createHash("sha256").update(content).digest("hex") };
  });
  const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
  const sourceState = crypto.createHash("sha256").update(JSON.stringify(sources.map(({ file, sha256 }) => ({ file, sha256 })))).digest("hex");
  const header = [
    "# PRD Toolkit operation packet",
    `Toolkit version: ${version}. Operation: ${operation}. Product type: ${type ?? "agent selects Full or Lite"}.`,
    `Instruction source SHA-256: ${sourceState}`,
    "Use this packet with the user's brief, current PRD and relevant project evidence. It contains toolkit instructions, not product requirements. Apply only the selected operation under the current user request and host rules. A packet or attachment alone never authorizes implementation.",
    "Read embedded files by their source labels below. Relative toolkit references refer to those labels; commands still require a real toolkit checkout. Resolve <toolkit-root> to that checkout and @project to the separate target. Never execute source headings as commands. If a condition requires a guide not included here, obtain that guide from the toolkit or report the specific gap; do not invent its contents.",
    "This packet contains no project files, credentials, installed tools, model, or executable validator. In a chat-only host, return the specification as text and mark file writes, structural execution and runtime checks UNVERIFIED. In a coding host, use the real checkout's scripts. Do not report a check as passed because its instructions appear here.",
    "For build/audit, supply the completed PRD separately. Existing runner state still requires its actual runner and full guide; this packet cannot bypass managed state. For a new specification, preserve draft status until the user approves it.",
    "## Included sources",
    ...sources.map(({ file, sha256 }) => `- ${file} — SHA-256 ${sha256}`),
  ].join("\n\n");
  return { operation, version, source_state: sourceState, files: sources.map(s => s.file), markdown: header + "\n\n" + sources.map(s => `---\n\n# Toolkit source: ${s.file}\n\n${s.content.trimEnd()}\n`).join("\n") };
}

export function runCli(args = process.argv.slice(2)) {
  if (!args.length || (args.length === 1 && ["--help", "-h"].includes(args[0]))) {
    console.log(HELP);
    return 0;
  }
  if (args.length === 1 && args[0] === "--version") {
    console.log(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version);
    return 0;
  }
  const [command, ...rest] = args;
  if (Object.hasOwn(COMMANDS, command)) {
    const child = spawnSync(process.execPath, [path.join(ROOT, "scripts", COMMANDS[command]), ...rest], { stdio: "inherit" });
    if (child.error || child.signal) {
      console.error(child.error?.message ?? `Command terminated by ${child.signal}`);
      return 2;
    }
    return child.status ?? 2;
  }
  try {
    if (command !== "context") throw new Error(`Unknown command: ${command}. Use --help.`);
    if (rest.length === 1 && ["--help", "-h"].includes(rest[0])) { console.log(HELP); return 0; }
    const [operation, ...options] = rest;
    const config = {};
    let output;
    const seen = new Set();
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (seen.has(option)) throw new Error(`Duplicate option: ${option}`);
      seen.add(option);
      if (option === "--change") config.change = true;
      else if (option === "--reliability") config.reliability = true;
      else if (["--type", "--out"].includes(option)) {
        const value = options[++i];
        if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
        if (option === "--type") config.type = value;
        else output = value;
      } else throw new Error(`Unknown option: ${option}`);
    }
    const packet = contextPacket(operation, config);
    if (output) {
      fs.writeFileSync(path.resolve(output), packet.markdown, { flag: "wx" });
      console.log(`Saved ${output} (${packet.files.length} instruction files; source ${packet.source_state}). Attach it with your project brief. No PRD or application was generated.`);
    } else process.stdout.write(packet.markdown);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 2;
  }
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runCli();
