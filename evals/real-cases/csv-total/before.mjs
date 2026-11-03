// Intentionally broken baseline for the CSV repair trial; not a supported tool.
import fs from "node:fs";
const args = process.argv.slice(2);
if (args.length !== 1) { console.error("Invalid arguments"); process.exit(2); }
let text;
try { text = fs.readFileSync(args[0], "utf8"); }
catch { console.error("Cannot read input"); process.exit(1); }
const rows = text.trim().split(/\r?\n/).slice(1);
const total = rows.reduce((sum, row) => sum + Number(row.split(",")[1]), 0);
console.log(JSON.stringify({ rows: rows.length, total: total.toFixed(2) }));
