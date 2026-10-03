#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_PATHS, validateToolkit } from "./validate-toolkit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function distributionManifest(root, result) {
  return {
    format_version: 1,
    package: "prd-toolkit",
    version: result.version,
    source_state: result.source_state,
    files: [...CANONICAL_PATHS].sort().map((file) => ({
      path: file,
      sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex"),
    })),
    limits: "Content identity only; not a signature, authorization or proof of product correctness. DISTRIBUTION.json is generated and excludes itself from the inventory.",
  };
}

export function verifyDistribution(directory) {
  const root = path.resolve(directory);
  const actualFiles = [];
  function walk(current, prefix = "") {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Distribution contains a symlink: ${name}`);
      if (entry.isDirectory()) walk(path.join(current, entry.name), name + "/");
      else if (entry.isFile()) actualFiles.push(name);
      else throw new Error(`Distribution contains a non-file entry: ${name}`);
    }
  }
  walk(root);
  if (JSON.stringify(actualFiles.sort()) !== JSON.stringify([...CANONICAL_PATHS, "DISTRIBUTION.json"].sort())) throw new Error("Distribution inventory has missing or unexpected files.");
  const result = validateToolkit(root);
  if (!result.valid) throw new Error("Exported toolkit validation failed.");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "DISTRIBUTION.json"), "utf8"));
  const expected = distributionManifest(root, result);
  if (JSON.stringify(manifest) !== JSON.stringify(expected)) throw new Error("Distribution manifest does not match the canonical source bytes.");
  return { directory: root, files: expected.files.length, version: expected.version, source_state: expected.source_state, verified: true };
}

// An explicit inventory keeps local experiments, media, state, and credentials
// out of a distribution. Existing destinations are never overwritten.
export function exportToolkit(destination, root = ROOT) {
  const target = path.resolve(destination);
  if (fs.existsSync(target)) throw new Error("Destination already exists; choose a new directory.");
  const result = validateToolkit(root);
  if (!result.valid) throw new Error("Toolkit validation failed; run validate-toolkit.mjs --json.");
  for (const file of CANONICAL_PATHS) {
    let current = path.resolve(root);
    for (const part of file.split("/")) {
      current = path.join(current, part);
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Distribution source must not be a symlink: ${file}`);
    }
  }
  fs.mkdirSync(target, { recursive: true });
  for (const file of CANONICAL_PATHS) {
    const output = path.join(target, file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(path.join(root, file), output, fs.constants.COPYFILE_EXCL);
  }
  const copied = validateToolkit(target);
  if (!copied.valid || copied.source_state !== result.source_state) {
    throw new Error("Export verification failed; destination retained for inspection.");
  }
  fs.writeFileSync(path.join(target, "DISTRIBUTION.json"), JSON.stringify(distributionManifest(target, copied), null, 2) + "\n", { flag: "wx" });
  verifyDistribution(target);
  return { directory: target, files: CANONICAL_PATHS.length, source_state: copied.source_state };
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length === 4 && process.argv[2] === "--verify") {
      console.log(JSON.stringify(verifyDistribution(process.argv[3]), null, 2));
    } else {
      if (process.argv.length !== 3 || process.argv[2].startsWith("--")) {
        throw new Error("Usage: node scripts/export-toolkit.mjs <new-output-directory> | --verify <exported-directory>");
      }
      console.log(JSON.stringify(exportToolkit(process.argv[2]), null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
