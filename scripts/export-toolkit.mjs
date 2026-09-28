#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_PATHS, validateToolkit } from "./validate-toolkit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  return { directory: target, files: CANONICAL_PATHS.length, source_state: copied.source_state };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3 || process.argv[2].startsWith("--")) {
      throw new Error("Usage: node scripts/export-toolkit.mjs <new-output-directory>");
    }
    console.log(JSON.stringify(exportToolkit(process.argv[2]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
