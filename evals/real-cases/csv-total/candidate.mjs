import fs from "node:fs";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false, closed = false;
  const finishField = () => { row.push(field); field = ""; closed = false; };
  const finishRow = () => { finishField(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += char;
    } else if (char === ",") finishField();
    else if (char === "\n" || char === "\r") {
      if (char === "\r") {
        if (text[++i] !== "\n") throw new Error("Bare CR");
      }
      finishRow();
    } else if (char === '"' && field === "" && !closed) quoted = true;
    else {
      if (char === '"' || closed) throw new Error("Malformed quoting");
      field += char;
    }
  }
  if (quoted) throw new Error("Unclosed quote");
  if (field !== "" || row.length > 0 || closed) finishRow();
  return rows;
}

const args = process.argv.slice(2);
if (args.length !== 1) { console.error("Invalid arguments"); process.exit(2); }
let text;
try {
  if (!fs.statSync(args[0]).isFile()) throw new Error("Not a file");
  text = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(args[0]));
} catch { console.error("Cannot read input"); process.exit(1); }
try {
  const records = parseCsv(text);
  const header = records.shift();
  if (header?.length !== 2 || header[0] !== "item" || header[1] !== "amount") throw new Error("Header");
  let total = 0n;
  for (const row of records) {
    if (row.length !== 2) throw new Error("Columns");
    const amount = row[1].match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
    if (!amount) throw new Error("Amount");
    const cents = BigInt(amount[2]) * 100n + BigInt((amount[3] ?? "").padEnd(2, "0"));
    total += amount[1] ? -cents : cents;
  }
  const absolute = total < 0n ? -total : total;
  console.log(JSON.stringify({ rows: records.length, total: `${total < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}` }));
} catch { console.error("Invalid CSV"); process.exit(1); }
