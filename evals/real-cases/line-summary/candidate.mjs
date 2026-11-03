import fs from "node:fs";

const args = process.argv.slice(2);
if (![1, 3].includes(args.length) || args[0].startsWith("--") || (args.length === 3 && args[1] !== "--contains")) {
  console.error("Invalid arguments");
  process.exit(2);
}
let text;
try {
  if (!fs.statSync(args[0]).isFile()) throw new Error("Not a file");
  text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(args[0]));
} catch {
  console.error("Cannot read input");
  process.exit(1);
}
const normalized = text.replace(/\r\n/g, "\n");
const lines = normalized === "" ? [] : normalized.replace(/\n$/, "").split("\n");
console.log(JSON.stringify({
  lines: lines.length,
  non_empty: lines.filter(line => line.trim().length > 0).length,
  matching: args.length === 3 ? lines.filter(line => line.includes(args[2])).length : null,
}));
