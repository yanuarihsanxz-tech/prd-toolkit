#!/usr/bin/env node
// compare-prd: read-only textual/structural comparison of the ACTIVE FR/NFR/AC
// definitions in two PRD files. Dependency-free. It never writes, merges,
// rewrites, or commits anything, and it does not judge semantic equivalence.
//
// What counts as an active definition (see docs/CHANGE_CONTRACT.md):
//   1. A row in a canonical table, recognized by its header:
//        FR : ID | Requirement | Priority | Acceptance Criteria IDs
//        NFR: ID | Category | Requirement | Target | Acceptance Criteria IDs
//        AC : ID | Requirement IDs | Observable Criterion | Required Evidence
//   2. A row in a simple table whose headers are `ID | <Requirement|Criterion|
//      Acceptance Criterion|Observable Criterion|Description> | ...`.
//   3. A bullet, numbered item, or heading that begins with an ID and carries
//      definition text (continuation text is included).
// Everything else is NOT a definition: reference/traceability tables,
// `ID | Status | Note` change-contract rows (retirement records are tracked as
// history), prose mentions, comments, fenced code, and frontmatter.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PREFIX_ORDER = { FR: 0, NFR: 1, AC: 2 };
const ID = '(?:FR|NFR|AC)-\\d{3,}';
const ID_ONLY_RE = new RegExp(`^(?:\\*\\*|__|\`)?(${ID})(?:\\*\\*|__|\`)?$`);
const ALL_IDS_RE = new RegExp(`\\b${ID}\\b`, 'g');
const DEF_RE = new RegExp(
  `^\\s*(?:#{1,6}\\s+|[-*+]\\s+|\\d+[.)]\\s+)+(?:\\*\\*|__|\`)?(${ID})(?:\\*\\*|__|\`)?(?=[\\s:.|)\\]\\u2014\\u2013-]|$)`,
);
const HEADING_RE = /^\s*#{1,6}\s/;
// A first cell / list item that is clearly an attempt at a requirement ID (valid or not).
const LOOKS_LIKE_REQ = /^(?:\*\*|__|`)?(?:FR|NFR|AC)-/i;
const MALFORMED_LINE_RE = /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)+(?:\*\*|__|`)?(?:FR|NFR|AC)-/i;
const SEP_RE = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/;

const CANONICAL = {
  fr: ['id', 'requirement', 'priority', 'acceptance criteria ids'],
  nfr: ['id', 'category', 'requirement', 'target', 'acceptance criteria ids'],
  ac: ['id', 'requirement ids', 'observable criterion', 'required evidence'],
};
const EXPECTED_PREFIX = { fr: 'FR', nfr: 'NFR', ac: 'AC' };
const SIMPLE_SECOND = new Set(['requirement', 'criterion', 'acceptance criterion', 'observable criterion', 'description']);
const CHANGE_STATUSES = new Set(['added', 'modified', 'removed', 'unchanged', 'retired']);
const RETIRED_STATUSES = new Set(['removed', 'retired']);

// ---------- small helpers ----------

function normalize(s) {
  return s
    .replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)?/, '')
    .replace(/\*\*|__|`|\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const normHeader = (s) => s.toLowerCase().replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
const camel = (h) => h.replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
const indentOf = (line) => line.length - line.trimStart().length;

function compareIds(a, b) {
  const [pa, na] = a.split('-');
  const [pb, nb] = b.split('-');
  return PREFIX_ORDER[pa] - PREFIX_ORDER[pb] || Number(na) - Number(nb);
}

function canonValue(v, isIdList) {
  const clean = v.replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
  if (isIdList) {
    const ids = clean.match(ALL_IDS_RE);
    const leftover = clean.replace(ALL_IDS_RE, '').replace(/[\s,;/&+]|\band\b/gi, '');
    if (ids && leftover === '') return [...new Set(ids)].sort(compareIds).join(', ');
  }
  return clean;
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (s[i] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

const isSep = (l) => l != null && l.includes('|') && SEP_RE.test(l);

function classifyTable(headers) {
  const h = headers.map(normHeader);
  // The shipped templates add Type to ACs and Rationale to FRs. Compare every
  // field in those known variants as well as the original v3 table shapes.
  if (h.join('|') === 'id|requirement ids|type|observable criterion|required evidence') return 'ac';
  if (h.join('|') === 'id|requirement|priority|rationale|acceptance criteria ids') return 'fr';
  for (const [kind, cols] of Object.entries(CANONICAL)) {
    if (h.length === cols.length && cols.every((c, i) => c === h[i])) return kind;
  }
  if (h[0] === 'id' && h[1] === 'status') return 'change';
  if (h[0] === 'id' && SIMPLE_SECOND.has(h[1])) return 'simple';
  return 'other';
}

// ---------- pass 1: mask frontmatter, comments, fences (line numbers preserved) ----------

function preprocess(text) {
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  const diagnostics = [];
  const lines = new Array(raw.length).fill(null);
  const transparent = new Array(raw.length).fill(false); // masked comment/fence lines: invisible, but not a definition boundary
  let start = 0;
  if (raw[0] && raw[0].trim() === '---') {
    const end = raw.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (end > 0) start = end + 1;
    else {
      diagnostics.push({ severity: 'error', code: 'UNCLOSED_FRONTMATTER', line: 1, message: 'YAML frontmatter is never closed; active definitions cannot be identified safely.' });
      return { lines, transparent, diagnostics };
    }
  }
  let fence = null; // { char, len, line }
  let inComment = false;
  let commentLine = 0;

  for (let i = start; i < raw.length; i++) {
    const line = raw[i];
    if (fence) {
      // Only the same character, at least as long, with nothing else, closes a fence.
      const m = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
      if (m && m[1][0] === fence.char && m[1].length >= fence.len) fence = null;
      transparent[i] = true;
      continue;
    }
    let out = '';
    let pos = 0;
    while (pos < line.length) {
      if (inComment) {
        const end = line.indexOf('-->', pos);
        if (end === -1) pos = line.length;
        else {
          inComment = false;
          pos = end + 3;
        }
      } else {
        const s = line.indexOf('<!--', pos);
        if (s === -1) {
          out += line.slice(pos);
          pos = line.length;
        } else {
          out += line.slice(pos, s);
          inComment = true;
          commentLine = i + 1;
          pos = s + 4;
        }
      }
    }
    const fo = /^\s*(`{3,}|~{3,})(.*)$/.exec(out);
    if (fo && !(fo[1][0] === '`' && fo[2].includes('`'))) {
      fence = { char: fo[1][0], len: fo[1].length, line: i + 1 };
      transparent[i] = true;
      continue;
    }
    if (out.trim() === '' && raw[i].trim() !== '') transparent[i] = true; // comment-only line
    else lines[i] = out;
  }
  if (fence) {
    diagnostics.push({
      severity: 'error',
      code: 'UNCLOSED_FENCE',
      line: fence.line,
      message: `Code fence opened here (${fence.char.repeat(fence.len)}) is never closed; everything after it was excluded, so the comparison would be incomplete.`,
    });
  }
  if (inComment) {
    diagnostics.push({
      severity: 'error',
      code: 'UNCLOSED_COMMENT',
      line: commentLine,
      message: 'HTML comment opened here is never closed; everything after it was excluded, so the comparison would be incomplete.',
    });
  }
  return { lines, transparent, diagnostics };
}

// ---------- pass 2: extract active definitions and retirement records ----------

const hasWords = (body) =>
  body
    .replace(ALL_IDS_RE, ' ')
    .split(/[^A-Za-z0-9]+/)
    .some((t) => t.length >= 3 && /[A-Za-z]/.test(t));

export function extractRequirements(text) {
  const { lines, transparent, diagnostics } = preprocess(text);
  const defs = new Map(); // id -> entries[] (document order)
  const retired = [];
  const changeRecords = [];

  const addDef = (entry) => {
    if (!defs.has(entry.id)) defs.set(entry.id, []);
    defs.get(entry.id).push(entry);
  };
  const warn = (code, line, message) => diagnostics.push({ severity: 'warning', code, line, message });
  const fail = (code, line, message) => diagnostics.push({ severity: 'error', code, line, message });

  function processTable(kind, headers, rows, headerLine) {
    if (kind === 'other') return; // references, traceability, anything unrecognized
    if (kind === 'change') {
      let ignored = 0;
      for (const r of rows) {
        const idCell = r.cells[0] || '';
        const idm = ID_ONLY_RE.exec(idCell);
        const status = (r.cells[1] || '').replace(/\*\*|__|`/g, '').trim().toLowerCase();
        if (!CHANGE_STATUSES.has(status)) {
          ignored++;
          continue;
        }
        if (!idm) {
          if (!LOOKS_LIKE_REQ.test(idCell) && /^[A-Za-z][A-Za-z0-9]*-\d+$/.test(idCell)) ignored++; // e.g. historical milestone M-001
          else fail('CHANGE_ROW_INVALID', r.line, `Change-contract row has status "${status}" but "${idCell}" is not a valid FR/NFR/AC ID (expected e.g. FR-001); the record would be lost.`);
          continue;
        }
        const rec = { id: idm[1], status, note: normalize(r.cells.slice(2).join(' ')), line: r.line };
        changeRecords.push(rec);
        if (RETIRED_STATUSES.has(status)) retired.push(rec);
      }
      if (ignored) {
        warn(
          'UNRECOGNIZED_STATUS_ROWS',
          headerLine,
          `${ignored} row(s) in this \`ID | Status\` table are not change-contract records (statuses: ${[...CHANGE_STATUSES].join(', ')}) and were ignored.`,
        );
      }
      return;
    }
    const cols = headers.slice(1);
    const keys = cols.map((h) => camel(normHeader(h)));
    const isList = cols.map((h) => /\bids\b/.test(normHeader(h)));
    let nonRequirement = 0;
    for (const r of rows) {
      if (r.cells.every((c) => c === '')) continue;
      const idCell = r.cells[0] || '';
      const idm = ID_ONLY_RE.exec(idCell);
      if (!idm) {
        if (kind === 'simple' && !LOOKS_LIKE_REQ.test(idCell)) {
          nonRequirement++; // e.g. a risk or milestone table that happens to use an ID header
          continue;
        }
        fail('ROW_ID_INVALID', r.line, `Row in a definitions table does not start with a single valid FR/NFR/AC ID (expected e.g. FR-001): "${normalize(r.cells.join(' | '))}". The row is rejected, not skipped.`);
        continue;
      }
      const id = idm[1];
      // Lite has historically used the four-column requirement table for both
      // FR and NFR rows. ACs still cannot appear in either requirement table.
      const combinedNfr = kind === 'fr' && headers.length === 4 && id.startsWith('NFR-');
      if (EXPECTED_PREFIX[kind] && !id.startsWith(`${EXPECTED_PREFIX[kind]}-`) && !combinedNfr) {
        fail('KIND_MISMATCH', r.line, `${id} appears in a ${EXPECTED_PREFIX[kind]} table.`);
        continue;
      }
      if (r.cells.length !== headers.length) {
        fail('ROW_CELL_COUNT', r.line, `${id} row has ${r.cells.length} cell(s) but the header has ${headers.length}. Escape literal pipes as \\| and complete the row; malformed rows are rejected, not padded or truncated.`);
        continue;
      }
      const fields = {};
      keys.forEach((k, idx) => {
        fields[k] = canonValue(r.cells[idx + 1] || '', isList[idx]);
      });
      addDef({
        id,
        form: `table:${kind}`,
        fields,
        text: normalize([id, ...Object.values(fields)].join(' ')),
        line: r.line,
      });
    }
    if (nonRequirement) {
      warn('NON_REQUIREMENT_ROWS', headerLine, `${nonRequirement} row(s) in this table do not use FR/NFR/AC IDs and were ignored.`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line == null) continue;

    if (line.includes('|') && isSep(lines[i + 1])) {
      const headers = splitRow(line);
      const kind = classifyTable(headers);
      const rows = [];
      let j = i + 2;
      while (j < lines.length) {
        const l = lines[j];
        if (l == null) {
          if (transparent[j]) {
            j++;
            continue;
          }
          break;
        }
        if (l.trim() === '' || !l.includes('|')) break;
        rows.push({ cells: splitRow(l), line: j + 1 });
        j++;
      }
      processTable(kind, headers, rows, i + 1);
      i = j - 1;
      continue;
    }

    const m = DEF_RE.exec(line);
    if (!m) {
      if (MALFORMED_LINE_RE.test(line)) {
        warn('MALFORMED_ID_LINE', i + 1, `List item or heading starts with an ID-like token that is not a valid FR/NFR/AC ID (expected e.g. FR-001); it is not treated as a definition: "${normalize(line)}".`);
      }
      continue;
    }
    const style = HEADING_RE.test(line) ? 'heading' : 'bullet';
    const parts = [line];
    const baseIndent = indentOf(line);
    for (let k = i + 1; k < lines.length; k++) {
      const next = lines[k];
      if (next == null) {
        if (transparent[k]) continue; // masked comment/fence: invisible, not a boundary
        break;
      }
      if (DEF_RE.test(next) || /^\s*\|/.test(next)) break;
      if (style === 'heading') {
        if (HEADING_RE.test(next)) break;
      } else if (next.trim() === '' || indentOf(next) <= baseIndent) break;
      parts.push(next);
    }
    const body = normalize(parts.join(' '));
    if (!hasWords(body)) continue; // reference-only line such as "- FR-001 -> AC-001"
    addDef({ id: m[1], form: 'text', style, fields: { text: body }, text: body, line: i + 1 });
  }

  // Resolve duplicates: conflicting content is an error, identical repeats a warning.
  const items = new Map();
  const entries = new Map();
  const occurrences = new Map();
  for (const [id, list] of defs) {
    occurrences.set(id, list.length);
    entries.set(id, list[0]);
    items.set(id, list[0].text);
    if (list.length > 1) {
      const sig = (e) => JSON.stringify([e.form, e.fields]);
      const conflicting = list.some((e) => sig(e) !== sig(list[0]));
      diagnostics.push({
        severity: conflicting ? 'error' : 'warning',
        code: conflicting ? 'DUPLICATE_DEFINITION' : 'DUPLICATE_DEFINITION_IDENTICAL',
        line: list[0].line,
        message: `${id} has ${list.length} active definitions (lines ${list.map((e) => e.line).join(', ')})${
          conflicting ? ' with conflicting fields or form, so the comparison is ambiguous.' : ' with identical fields.'
        }`,
      });
    }
  }

  // Retirement records must agree with the active set and with each other.
  const retiredIds = new Set(retired.map((r) => r.id));
  for (const id of retiredIds) {
    if (entries.has(id)) {
      const rec = retired.find((r) => r.id === id);
      diagnostics.push({
        severity: 'error',
        code: 'RETIRED_BUT_ACTIVE',
        line: rec.line,
        message: `${id} has a retirement record (line ${rec.line}) but is also an active definition (line ${entries.get(id).line}).`,
      });
    }
  }
  const byId = new Map();
  for (const rec of changeRecords) {
    if (!byId.has(rec.id)) byId.set(rec.id, []);
    byId.get(rec.id).push(rec);
  }
  for (const [id, recs] of byId) {
    const retiring = recs.some((r) => RETIRED_STATUSES.has(r.status));
    const other = recs.some((r) => !RETIRED_STATUSES.has(r.status) && r.status !== 'unchanged');
    if (retiring && (other || recs.some((r) => r.status === 'unchanged'))) {
      diagnostics.push({
        severity: 'error',
        code: 'CONFLICTING_CHANGE_RECORDS',
        line: recs[0].line,
        message: `${id} has conflicting change records (${recs.map((r) => `${r.status} @ line ${r.line}`).join('; ')}).`,
      });
    }
  }

  if (entries.size === 0) {
    if (retired.length === 0) {
      diagnostics.push({
        severity: 'error',
        code: 'NO_DEFINITIONS',
        line: 0,
        message:
          'No active FR/NFR/AC definitions or retirement records were found. The input may be empty or in an unsupported format. Supported: canonical FR/NFR/AC tables, simple `ID | Requirement|Criterion` tables, and bullets/headings that begin with an ID.',
      });
    } else {
      diagnostics.push({
        severity: 'warning',
        code: 'NO_ACTIVE_DEFINITIONS',
        line: 0,
        message: 'No active definitions found; only retirement records.',
      });
    }
  }

  return { items, entries, occurrences, retired, changeRecords, diagnostics };
}

// ---------- comparison ----------

function tokens(text, id) {
  return new Set(
    text
      .replace(id, ' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3),
  );
}

function similarity(a, b, id) {
  const ta = tokens(a, id);
  const tb = tokens(b, id);
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

function diffEntry(oldE, newE) {
  if (oldE.form !== newE.form) {
    if (oldE.text === newE.text) return [];
    return [
      { field: '(form)', old: oldE.form, new: newE.form },
      { field: '(text)', old: oldE.text, new: newE.text },
    ];
  }
  const keys = [...new Set([...Object.keys(oldE.fields), ...Object.keys(newE.fields)])];
  const out = [];
  for (const k of keys) {
    const o = oldE.fields[k] ?? '';
    const n = newE.fields[k] ?? '';
    if (o !== n) out.push({ field: k, old: o, new: n });
  }
  return out;
}

const locate = (label, d) => `${label}${d.line ? `:${d.line}` : ''}`;

export function comparePrd(oldText, newText, { reuseThreshold = 0.3, labels = {} } = {}) {
  const a = extractRequirements(oldText);
  const b = extractRequirements(newText);
  const labelOf = { old: labels.old ?? 'old', new: labels.new ?? 'new' };
  const diagnostics = [
    ...a.diagnostics.map((d) => ({ file: 'old', ...d })),
    ...b.diagnostics.map((d) => ({ file: 'new', ...d })),
  ].map((d) => ({ ...d, location: locate(labelOf[d.file], d) }));
  const valid = !diagnostics.some((d) => d.severity === 'error');

  const ids = [...new Set([...a.items.keys(), ...b.items.keys()])].sort(compareIds);
  const retiredNew = new Map(b.retired.map((r) => [r.id, r]));
  const added = [];
  const removed = [];
  const modified = [];
  let unchanged = 0;

  for (const id of ids) {
    const oe = a.entries.get(id);
    const ne = b.entries.get(id);
    if (!oe) added.push({ id, text: ne.text });
    else if (!ne) {
      const rec = retiredNew.get(id);
      removed.push({ id, text: oe.text, retirementRecorded: Boolean(rec), retirementNote: rec ? rec.note : null });
    } else {
      const changedFields = diffEntry(oe, ne);
      if (changedFields.length === 0) unchanged++;
      else {
        const sim = Number(similarity(oe.text, ne.text, id).toFixed(2));
        modified.push({ id, old: oe.text, new: ne.text, changedFields, similarity: sim, possibleIdReuse: sim < reuseThreshold });
      }
    }
  }

  const retiredOldIds = new Set(a.retired.map((r) => r.id));
  return {
    basis: 'textual/structural comparison of active definitions; not a semantic equivalence check',
    valid,
    counts: { old: a.items.size, new: b.items.size, added: added.length, removed: removed.length, modified: modified.length, unchanged },
    added,
    removed,
    modified,
    retired: { old: a.retired, new: b.retired },
    findings: {
      removedWithoutRetirementRecord: removed.filter((r) => !r.retirementRecorded).map((r) => r.id),
      retiredIdReactivated: [...retiredOldIds].filter((id) => b.items.has(id)).sort(compareIds),
      retirementHistoryDropped: [...retiredOldIds].filter((id) => !retiredNew.has(id) && !b.items.has(id)).sort(compareIds),
    },
    diagnostics,
  };
}

// ---------- CLI ----------

const USAGE = `Usage: compare-prd.mjs <old-prd.md> <new-prd.md> [--json] [--fail-on-removal]

Read-only comparison of the ACTIVE FR/NFR/AC definitions in two PRDs.
Textual/structural only; it does not judge semantic equivalence.

Options:
  --json              Machine-readable output (on invalid input: {basis, valid:false, diagnostics})
  --fail-on-removal   Exit 1 if any active ID was removed (a retirement record does not bypass this)
  -h, --help          Show this help (exit 0)

Exit codes:
  0  valid comparison produced
  1  removal detected with --fail-on-removal
  2  usage error, unreadable file, empty/unsupported input, or ambiguous input
     (conflicting duplicate definitions, unclosed fence/comment, retired-but-active ID)

Definitions: canonical FR/NFR/AC tables (by header), simple "ID | Requirement|Criterion"
tables, and bullets/headings that begin with an ID. Reference tables, change-contract
rows, comments, fenced code and frontmatter are not definitions.
"possibleIdReuse" is a non-blocking word-overlap heuristic that needs human review.`;

const fmtDiag = (d) => `${d.severity.toUpperCase()} ${d.code} ${d.location}: ${d.message}`;

function renderText(r) {
  const out = [];
  const c = r.counts;
  out.push(`Compared ${c.old} -> ${c.new} active entries: +${c.added} added, -${c.removed} removed, ~${c.modified} modified, ${c.unchanged} unchanged`);
  out.push(`(${r.basis})`);
  for (const x of r.removed) {
    out.push(`REVIEW removed  ${x.id}: ${x.text}${x.retirementRecorded ? `  [retirement recorded${x.retirementNote ? `: ${x.retirementNote}` : ''}]` : '  [no retirement record]'}`);
  }
  for (const x of r.modified) {
    out.push(`modified        ${x.id}${x.possibleIdReuse ? '  [REVIEW: low word overlap, possible ID reuse (heuristic)]' : ''}`);
    for (const f of x.changedFields) out.push(`  ${f.field}: "${f.old}" -> "${f.new}"`);
  }
  for (const x of r.added) out.push(`added          ${x.id}: ${x.text}`);
  for (const id of r.findings.retiredIdReactivated) out.push(`REVIEW ${id} was retired in the old PRD but is active again in the new PRD`);
  for (const id of r.findings.retirementHistoryDropped) out.push(`REVIEW retirement history for ${id} is absent from the new PRD`);
  return out.join('\n');
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('-')));
  const files = argv.filter((a) => !a.startsWith('-'));
  if (flags.has('--help') || flags.has('-h')) {
    console.log(USAGE);
    return 0;
  }
  const known = new Set(['--json', '--fail-on-removal']);
  const unknown = [...flags].filter((f) => !known.has(f));
  if (unknown.length || files.length !== 2) {
    console.error(unknown.length ? `Unknown option: ${unknown[0]}` : 'Expected exactly two PRD files.');
    console.error(USAGE);
    return 2;
  }
  let oldText;
  let newText;
  try {
    oldText = readFileSync(files[0], 'utf8');
    newText = readFileSync(files[1], 'utf8');
  } catch (err) {
    console.error(`Cannot read input: ${err.message}`);
    return 2;
  }
  const result = comparePrd(oldText, newText, { labels: { old: files[0], new: files[1] } });
  const json = flags.has('--json');

  if (!result.valid) {
    for (const d of result.diagnostics) console.error(fmtDiag(d));
    console.error('Comparison not produced: input is empty, unsupported, or ambiguous.');
    if (json) console.log(JSON.stringify({ basis: result.basis, valid: false, diagnostics: result.diagnostics }, null, 2));
    return 2;
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(renderText(result));
    for (const d of result.diagnostics) console.error(fmtDiag(d));
  }
  return flags.has('--fail-on-removal') && result.removed.length > 0 ? 1 : 0;
}

if (process.argv[1] && existsSync(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
