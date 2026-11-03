#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export function testFiles(root = ROOT) {
  const directory = path.join(root, "tests");
  const files = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".test.mjs"))
    .map(entry => path.join(directory, entry.name)).sort();
  if (!files.length) throw new Error("No toolkit tests found in tests/");
  return files;
}

export function runCli(args = process.argv.slice(2)) {
  try {
    // Explicit filenames work on Node 20 and Windows without shell glob expansion.
    const result = spawnSync(process.execPath, ["--test", ...args, ...testFiles()], { stdio: "inherit" });
    if (result.error || result.signal) throw new Error(result.error?.message ?? `Tests terminated by ${result.signal}`);
    return result.status ?? 2;
  } catch (error) { console.error(error.message); return 2; }
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runCli();
