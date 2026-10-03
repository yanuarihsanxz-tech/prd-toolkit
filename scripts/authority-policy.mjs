// Format contract only. These sentences retain the existing example policy.
// A matching document is never evidence that a person or host granted authority.
export const AUTHORITY_POLICY = Object.freeze({
  version: 1,
  heading: "Authority Policy v1",
  text: [
    "For a new native build, the user's explicit build request authorizes scoped local implementation.",
    "One exact plan approval covers declared local runner transitions.",
    "Pause only for a blocking decision, material scope change, or a genuine new authority boundary: external writes, destructive actions, purchases, credential changes, deployment, production, or owner acceptance.",
  ].join("\n\n"),
});

export const AUTHORITY_FORMAT_LIMIT = "Authority policy validation enforces document format only; a matching block is not evidence of real user authorization, host permission, runner approval, or owner acceptance.";

export function normalizeAuthorityPolicy(text) {
  return text.replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/^\s*(?:>\s*)+/gm, "")
    .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ").trim();
}

// The caller masks comments and fenced examples while preserving line numbers.
export function checkAuthorityPolicy(visibleSource, metadata) {
  if (!Object.hasOwn(metadata, "authority_policy")) {
    // Compatibility path: retain the pre-3.2 wording checks unchanged.
    const continuation = /one exact(?:-| )plan (?:owner )?approval covers|exact plan approval covers|plan approval covers (?:all|every) declared local non-production|explicit (?:user |future )?build request authorizes scoped local/i.test(visibleSource.replace(/\s+/g, " "));
    const boundary = /genuine (?:new )?(?:authority\s+boundary|[\s\S]{1,150}?authority\s+boundary)|production(?:\/| or )final owner acceptance|production activation(?:,? or| and) final owner acceptance/i.test(visibleSource);
    return [
      { code: "AUTHORITY_POLICY_LEGACY", severity: "warning", line: 1, message: "No authority_policy declared; legacy wording checks applied. To migrate, review and embed Authority Policy v1 and declare authority_policy: 1. This notice is non-blocking." },
      ...(!continuation || !boundary ? [{ code: "MILESTONE_AUTHORITY_POLICY", severity: "blocker", line: 1, message: "Milestones must name local build authority (explicit build request for native mode or exact plan approval for runner mode) and preserve genuine new authority, production, and final-acceptance boundaries." }] : []),
    ];
  }
  if (metadata.authority_policy !== AUTHORITY_POLICY.version) {
    return [{ code: "AUTHORITY_POLICY_VERSION_UNSUPPORTED", severity: "blocker", line: 1, message: "authority_policy must be the supported integer version 1; unknown or malformed versions cannot use legacy checks." }];
  }
  const lines = visibleSource.split("\n");
  const matches = [];
  let section = "";
  lines.forEach((line, index) => {
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!heading) return;
    if (heading[1].length <= 2) section = heading[2];
    if (normalizeAuthorityPolicy(heading[2]) === AUTHORITY_POLICY.heading) matches.push({ index, depth: heading[1].length, section });
  });
  const match = matches[0];
  const allowedSection = /^(?:5\. Architecture|10\. Milestones|3\. Architecture & Data Flow|4\. Implementation & Milestones)$/;
  let body = "";
  if (match) {
    let end = match.index + 1;
    while (end < lines.length && !/^ {0,3}#{1,6}\s/.test(lines[end])) end++;
    body = lines.slice(match.index + 1, end).join("\n");
  }
  if (matches.length !== 1 || match.depth < 3 || !allowedSection.test(match.section) || normalizeAuthorityPolicy(body) !== normalizeAuthorityPolicy(AUTHORITY_POLICY.text)) {
    return [{ code: "MILESTONE_AUTHORITY_POLICY", severity: "blocker", line: match ? match.index + 1 : 1, message: "authority_policy: 1 requires exactly one visible Authority Policy v1 subsection inside Architecture or Milestones, matching the canonical sentences after formatting normalization. See docs/AUTHORITY_POLICY.md." }];
  }
  return [];
}
