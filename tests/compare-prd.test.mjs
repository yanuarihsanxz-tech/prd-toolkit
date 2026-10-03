import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparePrd, extractRequirements } from '../scripts/compare-prd.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'compare-prd.mjs');

// ===========================================================================
// PART 1 - the seven original tests, retained unchanged.
// ===========================================================================

const OLD = `---
title: demo
---
## Requirements
- FR-001: Visitors can add favorites.
- FR-002: Favorites persist after reload
  in the same browser.
- NFR-001: Page loads quickly.

| ID | Criterion |
| --- | --- |
| AC-001 | Add a favorite and see it listed |
| AC-002 | Reload keeps the favorite |

\`\`\`mermaid
flowchart TD
  FR-999 --> AC-999
\`\`\`
`;

test('extracts bullets, continuation lines, table rows; ignores frontmatter and fences', () => {
  const { items } = extractRequirements(OLD);
  assert.deepEqual([...items.keys()], ['FR-001', 'FR-002', 'NFR-001', 'AC-001', 'AC-002']);
  assert.match(items.get('FR-002'), /persist after reload in the same browser/);
  assert.ok(!items.has('FR-999'));
});

test('reports added, removed, modified, unchanged', () => {
  const next = OLD
    .replace('- NFR-001: Page loads quickly.\n', '')
    .replace('Visitors can add favorites.', 'Visitors can add and remove favorites.')
    .concat('\n- FR-003: Show a reset action when saved data is unreadable.\n');
  const r = comparePrd(OLD, next);
  assert.deepEqual(r.removed.map((x) => x.id), ['NFR-001']);
  assert.deepEqual(r.added.map((x) => x.id), ['FR-003']);
  assert.deepEqual(r.modified.map((x) => x.id), ['FR-001']);
  assert.equal(r.modified[0].possibleIdReuse, false);
  assert.equal(r.counts.unchanged, 3);
});

test('flags low-similarity change as possible ID reuse', () => {
  const next = OLD.replace('Visitors can add favorites.', 'Administrators export quarterly billing statements.');
  const r = comparePrd(OLD, next);
  assert.equal(r.modified[0].id, 'FR-001');
  assert.equal(r.modified[0].possibleIdReuse, true);
});

test('heading-defined entries collect their block', () => {
  const doc = '### FR-010 Export\nUsers export CSV.\n\n### FR-011 Import\nUsers import CSV.\n';
  const { items } = extractRequirements(doc);
  assert.match(items.get('FR-010'), /Users export CSV/);
  assert.ok(!/import/i.test(items.get('FR-010')));
});

test('identical documents produce no differences', () => {
  const r = comparePrd(OLD, OLD);
  assert.equal(r.counts.added + r.counts.removed + r.counts.modified, 0);
});

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
}

test('CLI: --help exits 0 without files; bad usage exits 2', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  assert.equal(run([]).status, 2);
  assert.equal(run(['--bogus', 'a', 'b']).status, 2);
  assert.equal(run(['/nonexistent/a.md', '/nonexistent/b.md']).status, 2);
});

test('CLI: --fail-on-removal exits 1 only when an ID was removed; --json parses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cmp-'));
  const a = join(dir, 'a.md');
  const b = join(dir, 'b.md');
  writeFileSync(a, OLD);
  writeFileSync(b, OLD.replace('- NFR-001: Page loads quickly.\n', ''));
  assert.equal(run([a, b]).status, 0);
  assert.equal(run([a, b, '--fail-on-removal']).status, 1);
  assert.equal(run([a, a, '--fail-on-removal']).status, 0);
  const parsed = JSON.parse(run([a, b, '--json']).stdout);
  assert.equal(parsed.counts.removed, 1);
});

// ===========================================================================
// PART 2 - fixtures and helpers.
//
// FIXTURES, NOT THE REAL TOOLKIT EXAMPLES. These documents are modeled on the
// canonical table headers supplied by the toolkit owner. They have NOT been
// checked against the actual examples/*.md in the toolkit checkout.
// ===========================================================================

const FR_HEAD = '| ID | Requirement | Priority | Acceptance Criteria IDs |\n| --- | --- | --- | --- |';
const NFR_HEAD = '| ID | Category | Requirement | Target | Acceptance Criteria IDs |\n| --- | --- | --- | --- | --- |';
const AC_HEAD = '| ID | Requirement IDs | Observable Criterion | Required Evidence |\n| --- | --- | --- | --- |';
const row = (...cells) => `| ${cells.join(' | ')} |`;
const table = (head, ...rows) => [head, ...rows.map((r) => row(...r))].join('\n');
const tick = (n) => '`'.repeat(n);

// Lite-style fixture: FR + AC tables only.
const liteFixture = ({
  fr1 = 'Keep favorites after reload.',
  pri = 'Must',
  frAcs = 'AC-001',
  acReq = 'FR-001',
  acCrit = 'Add a favorite, reload, and see it listed.',
  acEvidence = 'Browser test log',
} = {}) =>
  [
    '---',
    'title: Favorites (LITE FIXTURE)',
    '---',
    '## Requirements',
    table(FR_HEAD, ['FR-001', fr1, pri, frAcs], ['FR-002', 'Offer a reset action when saved data is unreadable.', 'Should', 'AC-002']),
    '',
    '## Acceptance',
    table(AC_HEAD, ['AC-001', acReq, acCrit, acEvidence], ['AC-002', 'FR-002', 'Corrupt stored data; a reset action is shown.', 'Screenshot']),
    '',
  ].join('\n');

// Full-style fixture: FR + NFR + AC tables, a reference table, and an optional change contract.
const fullFixture = ({ target = 'Under 500 ms on a mid-range laptop', changeContract = '' } = {}) =>
  [
    '---',
    'title: Favorites (FULL FIXTURE)',
    '---',
    '## Functional requirements',
    table(FR_HEAD, ['FR-001', 'Keep favorites after reload.', 'Must', 'AC-001'], ['FR-002', 'Offer a reset action when saved data is unreadable.', 'Should', 'AC-002']),
    '',
    '## Non-functional requirements',
    table(NFR_HEAD, ['NFR-001', 'Performance', 'The favorites list renders after reload.', target, 'AC-003']),
    '',
    '## Acceptance criteria',
    table(
      AC_HEAD,
      ['AC-001', 'FR-001', 'Add a favorite, reload, and see it listed.', 'Browser test log'],
      ['AC-002', 'FR-002', 'Corrupt stored data; a reset action is shown.', 'Screenshot'],
      ['AC-003', 'NFR-001', 'Measure list render time after reload.', 'Timing output'],
    ),
    '',
    '## Traceability',
    table('| ID | References |\n| --- | --- |', ['FR-001', 'AC-001'], ['FR-002', 'AC-002'], ['NFR-001', 'AC-003']),
    '',
    changeContract,
  ].join('\n');

const byId = (list, id) => list.find((x) => x.id === id);
const codes = (r) => r.diagnostics.map((d) => d.code);

function runFiles(oldText, newText, extra = []) {
  const dir = mkdtempSync(join(tmpdir(), 'cmp-'));
  const a = join(dir, 'old.md');
  const b = join(dir, 'new.md');
  writeFileSync(a, oldText);
  writeFileSync(b, newText);
  return run([a, b, ...extra]);
}

// ===========================================================================
// PART 3 - regression tests for the four confirmed failures.
// ===========================================================================

const SINGLE_FR = `${FR_HEAD}\n| FR-001 | Keep favorites after reload. | Must | AC-001 |\n`;
const RETIREMENT = `## Change contract\n| ID | Status | Note |\n| --- | --- | --- |\n| FR-001 | removed | Retired; ID is not reused |\n`;

test('failure 1: a retirement record is classified as removed, not as an active definition', () => {
  const r = comparePrd(SINGLE_FR, RETIREMENT);
  assert.equal(r.valid, true);
  assert.equal(r.counts.removed, 1);
  assert.equal(r.counts.modified, 0);
  assert.deepEqual(r.removed.map((x) => x.id), ['FR-001']);
  assert.equal(r.removed[0].retirementRecorded, true);
  assert.equal(r.removed[0].retirementNote, 'Retired; ID is not reused');
  assert.deepEqual(r.findings.removedWithoutRetirementRecord, []);
});

test('failure 1: retirement stays in history but leaves the active set', () => {
  const { items, retired } = extractRequirements(RETIREMENT);
  assert.ok(!items.has('FR-001'));
  assert.equal(retired.length, 1);
  assert.equal(retired[0].id, 'FR-001');
  assert.equal(retired[0].status, 'removed');
  const r = comparePrd(SINGLE_FR, RETIREMENT);
  assert.equal(r.retired.new[0].id, 'FR-001');
});

test('failure 1: a retirement record cannot bypass --fail-on-removal', () => {
  const res = runFiles(SINGLE_FR, RETIREMENT, ['--fail-on-removal']);
  assert.equal(res.status, 1, res.stderr);
});

test('a removal without a retirement record is reported as a finding', () => {
  const r = comparePrd(fullFixture(), fullFixture().replace(/\| FR-002 .*\n/, ''));
  assert.deepEqual(r.removed.map((x) => x.id), ['FR-002']);
  assert.equal(r.removed[0].retirementRecorded, false);
  assert.deepEqual(r.findings.removedWithoutRetirementRecord, ['FR-002']);
});

test('failure 2: an unchanged reference table before the definitions does not hide a change', () => {
  const refs = '| ID | References |\n| --- | --- |\n| FR-001 | AC-001 |\n\n';
  const r = comparePrd(refs + SINGLE_FR, refs + SINGLE_FR.replace('Keep', 'Erase'));
  assert.equal(r.valid, true);
  assert.equal(r.counts.modified, 1);
  assert.equal(r.counts.unchanged, 0);
  assert.equal(r.modified[0].id, 'FR-001');
  assert.equal(r.modified[0].changedFields[0].field, 'requirement');
});

test('failure 2: changing only a reference table is not a requirement change', () => {
  const r = comparePrd(fullFixture(), fullFixture().replace('| FR-001 | AC-001 |', '| FR-001 | AC-001, AC-002 |'));
  assert.equal(r.valid, true);
  assert.equal(r.counts.modified, 0);
  assert.equal(r.counts.unchanged, 6);
});

test('failure 3: conflicting duplicate definitions are reported with locations and invalidate the comparison', () => {
  const dup = (t) => `${SINGLE_FR}\n## Later\n${FR_HEAD}\n| FR-001 | ${t} | Must | AC-001 |\n`;
  const r = comparePrd(dup('Keep favorites after reload.'), dup('Erase favorites after reload.'));
  assert.equal(r.valid, false);
  const d = r.diagnostics.find((x) => x.code === 'DUPLICATE_DEFINITION');
  assert.ok(d, 'expected DUPLICATE_DEFINITION');
  assert.equal(d.severity, 'error');
  assert.equal(d.file, 'new');
  assert.match(d.message, /FR-001/);
  assert.match(d.message, /lines 3, 8/);
  assert.match(d.location, /^new:/);
});

test('failure 3: the CLI exits 2 with a diagnostic for conflicting definitions and emits no comparison', () => {
  const dup = (t) => `${SINGLE_FR}\n## Later\n${FR_HEAD}\n| FR-001 | ${t} | Must | AC-001 |\n`;
  const res = runFiles(dup('Keep favorites after reload.'), dup('Erase favorites after reload.'));
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DUPLICATE_DEFINITION/);
  assert.match(res.stderr, /new\.md:\d+/);
  assert.match(res.stderr, /Comparison not produced/);
  assert.equal(res.stdout.trim(), '');
  const j = runFiles(dup('a b c'), dup('x y z'), ['--json']);
  assert.equal(j.status, 2);
  const parsed = JSON.parse(j.stdout);
  assert.equal(parsed.valid, false);
  assert.ok(parsed.diagnostics.length > 0);
  assert.equal(parsed.counts, undefined);
});

test('identical duplicate definitions are a warning, not an error', () => {
  const doc = `${SINGLE_FR}\n${SINGLE_FR}`;
  const r = comparePrd(doc, doc);
  assert.equal(r.valid, true);
  assert.deepEqual(codes(r), ['DUPLICATE_DEFINITION_IDENTICAL', 'DUPLICATE_DEFINITION_IDENTICAL']);
  assert.equal(r.diagnostics[0].severity, 'warning');
});

test('failure 4: a multiline HTML comment does not create live entries', () => {
  const doc = `<!--\n- FR-999: Hidden example\n-->\n- FR-001: Real requirement.\n`;
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001']);
  const inline = extractRequirements('- FR-001: Real <!-- - FR-998: no --> requirement.\n');
  assert.deepEqual([...inline.items.keys()], ['FR-001']);
  assert.ok(!/FR-998/.test(inline.items.get('FR-001')));
});

test('failure 4: a comment can open before a fence-looking line and still hide it', () => {
  const doc = `<!--\n${tick(3)}\n-->\n- FR-001: Real requirement.\n- FR-002: Also real.\n`;
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001', 'FR-002']);
});

test('failure 4: a four-backtick fence is not closed by an inner three-backtick line', () => {
  const doc = [
    `${tick(4)}markdown`,
    tick(3),
    '- FR-997: inside inner',
    tick(3),
    '- FR-998: still inside the outer fence',
    tick(4),
    '- FR-001: Real requirement.',
    '',
  ].join('\n');
  const { items, diagnostics } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001']);
  assert.equal(diagnostics.length, 0);
});

test('failure 4: a different fence character or a shorter fence does not close a fence', () => {
  const tilde = [`${tick(3)}`, '~~~', '- FR-900: hidden', '~~~', `${tick(3)}`, '- FR-001: Real requirement.', ''].join('\n');
  assert.deepEqual([...extractRequirements(tilde).items.keys()], ['FR-001']);
  // Shorter ~~~ lines inside a ~~~~ fence do not close it; an equal-length ~~~~ does.
  const shorter = ['~~~~', '~~~', '- FR-901: hidden', '~~~', '~~~~', '- FR-001: Real.', ''].join('\n');
  assert.deepEqual([...extractRequirements(shorter).items.keys()], ['FR-001']);
  // A longer closing line (~~~~~) legitimately closes a ~~~~ fence, so later lines are visible.
  const longerClose = ['~~~~', '- FR-901: hidden', '~~~~~', '- FR-001: Real.', ''].join('\n');
  assert.deepEqual([...extractRequirements(longerClose).items.keys()], ['FR-001']);
  const longerCloses = [tick(3), '- FR-903: hidden', tick(5), '- FR-001: Real.', ''].join('\n');
  assert.deepEqual([...extractRequirements(longerCloses).items.keys()], ['FR-001']);
});

test('an unclosed fence or comment makes the input invalid instead of silently truncating it', () => {
  const fence = extractRequirements(`- FR-001: Real.\n${tick(3)}\n- FR-002: swallowed\n`);
  assert.ok(fence.diagnostics.some((d) => d.code === 'UNCLOSED_FENCE' && d.severity === 'error' && d.line === 2));
  const comment = extractRequirements(`- FR-001: Real.\n<!-- never closed\n- FR-002: swallowed\n`);
  assert.ok(comment.diagnostics.some((d) => d.code === 'UNCLOSED_COMMENT' && d.line === 2));
  assert.equal(comparePrd(`- FR-001: Real.\n${tick(3)}\n`, '- FR-001: Real.\n').valid, false);
});

// ===========================================================================
// PART 4 - additional verification required by the review.
// ===========================================================================

test('changing only an AC required-evidence cell is detected', () => {
  const r = comparePrd(liteFixture(), liteFixture({ acEvidence: 'Browser test log plus screen recording' }));
  assert.equal(r.valid, true);
  assert.deepEqual(r.modified.map((x) => x.id), ['AC-001']);
  assert.deepEqual(r.modified[0].changedFields.map((f) => f.field), ['requiredEvidence']);
  assert.equal(r.counts.unchanged, 3);
});

test('requirement text, priority, target, AC mappings, criterion and evidence changes are each visible', () => {
  const cases = [
    ['requirement text', liteFixture(), liteFixture({ fr1: 'Erase favorites after reload.' }), 'FR-001', 'requirement'],
    ['priority', liteFixture(), liteFixture({ pri: 'Should' }), 'FR-001', 'priority'],
    ['FR to AC mapping', liteFixture(), liteFixture({ frAcs: 'AC-001, AC-002' }), 'FR-001', 'acceptanceCriteriaIds'],
    ['AC to FR mapping', liteFixture(), liteFixture({ acReq: 'FR-001, FR-002' }), 'AC-001', 'requirementIds'],
    ['observable criterion', liteFixture(), liteFixture({ acCrit: 'Add a favorite and see it listed.' }), 'AC-001', 'observableCriterion'],
    ['NFR target', fullFixture(), fullFixture({ target: 'Under 200 ms on a mid-range laptop' }), 'NFR-001', 'target'],
  ];
  for (const [label, a, b, id, field] of cases) {
    const r = comparePrd(a, b);
    assert.equal(r.valid, true, label);
    assert.deepEqual(r.modified.map((x) => x.id), [id], label);
    assert.deepEqual(r.modified[0].changedFields.map((f) => f.field), [field], label);
  }
});

test('ID-list cells are compared as sets: reordering or spacing is not a change', () => {
  const a = liteFixture({ frAcs: 'AC-001, AC-002' });
  const b = liteFixture({ frAcs: 'AC-002,  AC-001' });
  assert.equal(comparePrd(a, b).counts.modified, 0);
});

test('multiline bullet definition changes are detected', () => {
  const mk = (second) => `- FR-001: Favorites persist after reload\n  in the same browser\n  ${second}\n- FR-002: Next.\n`;
  const r = comparePrd(mk('and survive a tab restart.'), mk('but not a tab restart.'));
  assert.deepEqual(r.modified.map((x) => x.id), ['FR-001']);
  assert.equal(r.counts.unchanged, 1);
});

test('multiline heading definition changes are detected', () => {
  const mk = (line) => `### FR-010 Export\nUsers export CSV.\n${line}\n\n### FR-011 Import\nUsers import CSV.\n`;
  const r = comparePrd(mk('Large files are streamed.'), mk('Large files are rejected.'));
  assert.deepEqual(r.modified.map((x) => x.id), ['FR-010']);
  assert.equal(r.counts.unchanged, 1);
});

test('reference-only bullets and prose mentions are not definitions', () => {
  const doc = '- FR-001 -> AC-001\n- FR-001: Keep favorites after reload.\nSee FR-002 for details.\n';
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001']);
  assert.match(items.get('FR-001'), /Keep favorites/);
});

test('empty and unsupported input is explicit', () => {
  for (const text of ['', '   \n\n', '# Just prose\n\nNo requirement IDs here.\n', '| A | B |\n| --- | --- |\n| 1 | 2 |\n']) {
    const r = comparePrd(text, liteFixture());
    assert.equal(r.valid, false);
    assert.ok(codes(r).includes('NO_DEFINITIONS'));
    assert.equal(r.diagnostics.find((d) => d.code === 'NO_DEFINITIONS').file, 'old');
  }
});

test('CLI: empty or unsupported input exits 2 with the documented diagnostic', () => {
  const empty = runFiles('', liteFixture());
  assert.equal(empty.status, 2);
  assert.match(empty.stderr, /NO_DEFINITIONS/);
  assert.match(empty.stderr, /old\.md/);
  const prose = runFiles(liteFixture(), '# Notes\n\nNothing structured here.\n', ['--fail-on-removal']);
  assert.equal(prose.status, 2, 'invalid input must win over --fail-on-removal');
  assert.equal(empty.stdout.trim(), '');
});

test('a retired ID that is also an active definition is ambiguous', () => {
  const doc = `${SINGLE_FR}\n${RETIREMENT}`;
  const r = comparePrd(SINGLE_FR, doc);
  assert.equal(r.valid, false);
  assert.ok(codes(r).includes('RETIRED_BUT_ACTIVE'));
});

test('conflicting change records for one ID are ambiguous', () => {
  const doc = `${SINGLE_FR.replace('FR-001', 'FR-005')}\n| ID | Status | Note |\n| --- | --- | --- |\n| FR-001 | removed | gone |\n| FR-001 | modified | changed |\n`;
  const r = comparePrd(SINGLE_FR, doc);
  assert.ok(codes(r).includes('CONFLICTING_CHANGE_RECORDS'));
  assert.equal(r.valid, false);
});

test('a retired ID that returns in a later PRD is surfaced for review (non-blocking)', () => {
  const r = comparePrd(RETIREMENT, SINGLE_FR);
  assert.equal(r.valid, true);
  assert.deepEqual(r.findings.retiredIdReactivated, ['FR-001']);
  assert.equal(runFiles(RETIREMENT, SINGLE_FR, ['--fail-on-removal']).status, 0);
});

test('status tables that are not change records are ignored with a warning', () => {
  const doc = `${liteFixture()}\n| ID | Status | Evidence |\n| --- | --- | --- |\n| AC-001 | UNVERIFIED | none |\n`;
  const r = comparePrd(doc, doc);
  assert.equal(r.valid, true);
  assert.ok(codes(r).includes('UNRECOGNIZED_STATUS_ROWS'));
  assert.equal(r.counts.old, 4);
});

test('possibleIdReuse is a non-blocking heuristic', () => {
  const r = comparePrd(liteFixture(), liteFixture({ fr1: 'Administrators export quarterly billing statements.' }));
  assert.equal(r.modified[0].possibleIdReuse, true);
  assert.equal(r.valid, true);
  assert.equal(runFiles(liteFixture(), liteFixture({ fr1: 'Administrators export quarterly billing statements.' }), ['--fail-on-removal']).status, 0);
});

test('a meaning flip with high word overlap is modified but not flagged as ID reuse', () => {
  const r = comparePrd(liteFixture(), liteFixture({ fr1: 'Erase favorites after reload.' }));
  assert.equal(r.modified[0].id, 'FR-001');
  assert.equal(r.modified[0].possibleIdReuse, false);
});

test('ordering is stable and numeric: FR, NFR, AC; FR-002 before FR-010', () => {
  const doc = '- AC-001: a thing here.\n- FR-010: ten requirement.\n- NFR-001: perf requirement.\n- FR-002: two requirement.\n';
  const r = comparePrd('- FR-001: seed requirement.\n', doc);
  assert.deepEqual(r.added.map((x) => x.id), ['FR-002', 'FR-010', 'NFR-001', 'AC-001']);
});

test('escaped pipes inside a cell do not split the cell', () => {
  const doc = `${FR_HEAD}\n| FR-001 | Accept a \\| b input. | Must | AC-001 |\n`;
  const { entries } = extractRequirements(doc);
  assert.match(entries.get('FR-001').fields.requirement, /a \| b input/);
});

test('CRLF input behaves like LF input', () => {
  const lf = liteFixture();
  assert.equal(comparePrd(lf, lf.replace(/\n/g, '\r\n')).counts.modified, 0);
});

test('Full fixture parses into the expected active set', () => {
  const { items, diagnostics } = extractRequirements(fullFixture());
  assert.deepEqual([...items.keys()], ['FR-001', 'FR-002', 'NFR-001', 'AC-001', 'AC-002', 'AC-003']);
  assert.equal(diagnostics.length, 0);
});

test('JSON output is parseable for valid and for removal results; --help still needs no files', () => {
  const ok = runFiles(liteFixture(), liteFixture({ pri: 'Should' }), ['--json']);
  assert.equal(ok.status, 0);
  const parsed = JSON.parse(ok.stdout);
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.modified[0].changedFields.map((f) => f.field), ['priority']);
  const removal = runFiles(SINGLE_FR, RETIREMENT, ['--json', '--fail-on-removal']);
  assert.equal(removal.status, 1);
  assert.equal(JSON.parse(removal.stdout).removed[0].retirementRecorded, true);
  assert.equal(run(['--help']).status, 0);
  assert.equal(run(['-h']).status, 0);
});

// ===========================================================================
// PART 5 - v3 regressions (comments in heading definitions, duplicate field
// boundaries, malformed rows, bare prose) and related parsing paths.
// Fixtures are synthetic, as above.
// ===========================================================================

const simpleTable = (...rows) => ['| ID | Criterion | Owner |', '| --- | --- | --- |', ...rows.map((r) => row(...r))].join('\n');

test('v3-1: a masked comment does not terminate a heading definition', () => {
  const mk = (last) =>
    ['### FR-001 Export', '', 'Users export CSV.', '<!-- internal note -->', last, '', '### FR-002 Import', 'Users import CSV.', ''].join('\n');
  const r = comparePrd(mk('Large files are streamed.'), mk('Large files are rejected.'));
  assert.equal(r.valid, true);
  assert.deepEqual(r.modified.map((x) => x.id), ['FR-001']);
  assert.equal(r.counts.unchanged, 1);
  const { items } = extractRequirements(mk('Large files are streamed.'));
  assert.match(items.get('FR-001'), /Users export CSV\. Large files are streamed\./);
  assert.ok(!/internal note/.test(items.get('FR-001')));
  assert.ok(!/import/i.test(items.get('FR-001')));
});

test('v3-1: multiline comments and fenced blocks are invisible but not boundaries', () => {
  const doc = ['### FR-001 Export', 'Before.', '<!--', '- FR-999: hidden', '-->', tick(3), '### FR-998 hidden', tick(3), 'After.', '### FR-002 Next', 'Body.', ''].join('\n');
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001', 'FR-002']);
  assert.match(items.get('FR-001'), /Before\. After\./);
});

test('v3-1: bullet boundaries still hold around masked comment lines', () => {
  const mk = (tail) => `- FR-001: Favorites persist\n  <!-- note -->\n  ${tail}\n- FR-002: Next requirement.\n`;
  const r = comparePrd(mk('after reload.'), mk('until restart.'));
  assert.deepEqual(r.modified.map((x) => x.id), ['FR-001']);
  assert.equal(r.counts.unchanged, 1);
  const split = extractRequirements('- FR-001: First one.\n<!-- c -->\n- FR-002: Second one.\n');
  assert.ok(!/Second/.test(split.items.get('FR-001')));
  const blank = extractRequirements('- FR-001: First one.\n<!-- c -->\n\n  not part of it\n');
  assert.ok(!/not part/.test(blank.items.get('FR-001')));
});

test('v3-1: a comment line between table rows does not drop later rows', () => {
  const doc = `${FR_HEAD}\n| FR-001 | One thing here. | Must | AC-001 |\n<!-- note -->\n| FR-002 | Two thing here. | Must | AC-002 |\n`;
  assert.deepEqual([...extractRequirements(doc).items.keys()], ['FR-001', 'FR-002']);
});

test('v3-2: duplicate definitions with the same flattened text but different fields conflict', () => {
  const oldDoc = simpleTable(['AC-001', 'Export CSV', 'Team A'], ['AC-001', 'Export CSV', 'Team A']);
  const newDoc = simpleTable(['AC-001', 'Export CSV', 'Team A'], ['AC-001', 'Export', 'CSV Team A']);
  const r = comparePrd(oldDoc, newDoc);
  assert.equal(r.valid, false);
  const d = r.diagnostics.find((x) => x.code === 'DUPLICATE_DEFINITION');
  assert.ok(d);
  assert.equal(d.file, 'new');
  assert.match(d.message, /lines 3, 4/);
  assert.deepEqual(codes(r).filter((c) => c.startsWith('DUPLICATE')), ['DUPLICATE_DEFINITION_IDENTICAL', 'DUPLICATE_DEFINITION']);
  const res = runFiles(oldDoc, newDoc);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DUPLICATE_DEFINITION/);
  assert.equal(res.stdout.trim(), '');
});

test('v3-2: duplicates with a different definition form conflict; identical structured duplicates only warn', () => {
  const mixed = `${simpleTable(['AC-001', 'Export CSV', 'Team A'])}\n\n- AC-001: Export CSV Team A\n`;
  assert.ok(codes(comparePrd(mixed, mixed)).includes('DUPLICATE_DEFINITION'));
  const same = simpleTable(['AC-001', 'Export CSV', 'Team A'], ['AC-001', 'Export CSV', 'Team A']);
  const r = comparePrd(same, same);
  assert.equal(r.valid, true);
  assert.deepEqual(codes(r), ['DUPLICATE_DEFINITION_IDENTICAL', 'DUPLICATE_DEFINITION_IDENTICAL']);
});

test('v3-3: a row with an extra cell is rejected, not truncated', () => {
  const mk = (cell) => `| ID | Criterion |\n| --- | --- |\n| AC-001 | Show a total. | ${cell} |\n`;
  const r = comparePrd(mk('Log one'), mk('Log two'));
  assert.equal(r.valid, false);
  const d = r.diagnostics.filter((x) => x.code === 'ROW_CELL_COUNT');
  assert.equal(d.length, 2);
  assert.equal(d[0].severity, 'error');
  assert.match(d[0].message, /3 cell\(s\) but the header has 2/);
  const res = runFiles(mk('Log one'), mk('Log two'));
  assert.equal(res.status, 2);
  assert.match(res.stderr, /ROW_CELL_COUNT/);
  assert.equal(res.stdout.trim(), '');
});

test('v3-3: short rows and wrong-width canonical rows are rejected, not padded', () => {
  const short = `${FR_HEAD}\n| FR-001 | Keep favorites after reload. | Must |\n`;
  assert.ok(codes(comparePrd(short, liteFixture())).includes('ROW_CELL_COUNT'));
  assert.equal(comparePrd(short, liteFixture()).valid, false);
  const wide = `${AC_HEAD}\n| AC-001 | FR-001 | Criterion text. | Evidence | extra |\n`;
  assert.equal(comparePrd(wide, wide).valid, false);
  assert.equal(extractRequirements(wide).items.size, 0);
});

test('v3-3: invalid IDs in recognized definition tables are rejected, not skipped', () => {
  for (const bad of ['FR-1', 'FR-001, FR-002', 'fr-001', '', 'FR-001 (primary)']) {
    const doc = `${FR_HEAD}\n| FR-002 | Real requirement text. | Must | AC-002 |\n| ${bad} | Another requirement. | Must | AC-001 |\n`;
    const r = comparePrd(doc, doc);
    assert.equal(r.valid, false, `bad id ${JSON.stringify(bad)}`);
    assert.ok(codes(r).includes('ROW_ID_INVALID'), `bad id ${JSON.stringify(bad)}`);
  }
  const simple = `| ID | Criterion |\n| --- | --- |\n| AC-1 | Show a total. |\n| AC-002 | Show a count. |\n`;
  assert.ok(codes(comparePrd(simple, simple)).includes('ROW_ID_INVALID'));
  const res = runFiles(`${FR_HEAD}\n| FR-1 | Keep it. | Must | AC-001 |\n`, liteFixture());
  assert.equal(res.status, 2);
  assert.match(res.stderr, /ROW_ID_INVALID/);
});

test('v3-3: a wrong-kind ID in a canonical table is an error; fully empty rows are ignored', () => {
  const doc = `${FR_HEAD}\n| AC-005 | Not a functional requirement. | Must | AC-001 |\n`;
  assert.ok(codes(comparePrd(doc, doc)).includes('KIND_MISMATCH'));
  assert.equal(comparePrd(doc, doc).valid, false);
  const blankRow = `${FR_HEAD}\n| FR-001 | Keep favorites after reload. | Must | AC-001 |\n|  |  |  |  |\n`;
  assert.equal(comparePrd(blankRow, blankRow).valid, true);
});

test('v3-3: a simple ID table of non-requirement IDs is ignored with a warning, not an error', () => {
  const doc = `${liteFixture()}\n| ID | Description |\n| --- | --- |\n| R-001 | A risk. |\n| R-002 | Another risk. |\n`;
  const r = comparePrd(doc, doc);
  assert.equal(r.valid, true);
  assert.ok(codes(r).includes('NON_REQUIREMENT_ROWS'));
  assert.equal(r.counts.old, 4);
});

test('v3-3: a change-contract row with a known status but a malformed ID is rejected', () => {
  const bad = `${SINGLE_FR}\n| ID | Status | Note |\n| --- | --- | --- |\n| FR-9 | removed | typo |\n`;
  const r = comparePrd(SINGLE_FR, bad);
  assert.equal(r.valid, false);
  assert.ok(codes(r).includes('CHANGE_ROW_INVALID'));
  const other = `${SINGLE_FR}\n| ID | Status | Note |\n| --- | --- | --- |\n| M-001 | added | milestone |\n`;
  assert.equal(comparePrd(SINGLE_FR, other).valid, true);
});

test('v3-3: a malformed ID in a list item or heading warns instead of silently vanishing', () => {
  const doc = '- FR-001: Real requirement.\n- FR-1: Typo requirement.\n### AC-12 Typo heading\n';
  const r = comparePrd(doc, doc);
  assert.equal(r.valid, true);
  assert.equal(codes(r).filter((c) => c === 'MALFORMED_ID_LINE').length, 4);
  assert.deepEqual([...extractRequirements(doc).items.keys()], ['FR-001']);
});

test('v3-4: bare prose that starts with an ID is not a definition', () => {
  const doc = '- FR-001: Keep favorites after reload.\n\nFR-002: See FR-001 for additional details.\n';
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001']);
  const only = extractRequirements('FR-002: See FR-001 for additional details.\n');
  assert.ok(only.diagnostics.some((d) => d.code === 'NO_DEFINITIONS'));
  assert.equal(comparePrd('FR-002: See FR-001.\n', liteFixture()).valid, false);
});

test('v3-4: bullet, numbered item and heading syntax still define; bare ID inside a bullet is continuation text', () => {
  const doc = '- FR-001: Bullet requirement.\n1. FR-002: Numbered requirement.\n### FR-003 Heading requirement\nBody.\n- FR-004: Wrapped\n  FR-001: is only continuation text\n';
  const { items } = extractRequirements(doc);
  assert.deepEqual([...items.keys()], ['FR-001', 'FR-002', 'FR-003', 'FR-004']);
  assert.match(items.get('FR-004'), /continuation text/);
  assert.match(items.get('FR-001'), /Bullet requirement/);
});

test('v3: related-path check - diagnostics and exit codes through the CLI', () => {
  const ok = runFiles(liteFixture(), liteFixture({ pri: 'Should' }));
  assert.equal(ok.status, 0);
  assert.equal(runFiles(`${FR_HEAD}\n| FR-001 | Keep it here. | Must |\n`, liteFixture(), ['--json']).status, 2);
  assert.equal(run(['--help']).status, 0);
});
