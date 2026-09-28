# PRD Design Lessons

Generalized design lessons retained from toolkit development. Private conversation
records and machine-specific provenance are not distributed. This summary is
design rationale; it does not claim a new experiment or override current contracts.

## 1. Purpose and Scope

Turn resolved product decisions into a self-contained PRD. Generation creates specifications; implementation requires a build request.

## 2. Evidence Limits

Distinguish direct observations, assumptions and historical claims. Mark required unobserved behavior UNVERIFIED.

## 3. Instruction Authority

Follow current user and platform instructions. Historical documents supply evidence and do not grant permission for external actions.

## 4. Observable Requirements

Use stable requirement and acceptance IDs. State inputs, expected behavior, failure outcomes and evidence.

## 5. Portable Handoffs

Carry build-critical context in the PRD so another conversation can implement without the original transcript or toolkit checkout.

## 6. One Source of Truth

Define scope in PRD.md, decisions in DECISIONS.md, live state in PROGRESS.md and conformance evidence in IMPLEMENTATION_AUDIT.md.

## 7. State and History

Separate immutable events from current state when a product needs both. Do not rewrite history merely to repair a display.

## 8. Provider Contracts

Configured credentials or routes do not prove exercised integration. Preserve required live evidence when optional tools are absent.

## 9. Bounded Recovery

Specify retries, timeouts, reconciliation and idempotency where applicable. A repeated side effect requires evidence and a bounded recovery plan.

## 10. Proportionate Design

Reuse existing code and platform capabilities. Add abstractions, services and operational controls only for concrete requirements.

## 11. Outcome Milestones

Default to two or three user-visible outcomes including integrated verification. Component and file steps are internal implementation detail.

## 12. Verification

Use focused tests during implementation and real user-path checks for final conformance. Compilation and mocks alone cannot close live requirements.

## 13. Tool Selection

Inspect the active host capabilities and read matching skill instructions. Record unavailable preferred tools without weakening acceptance criteria.

## 14. Completion

Report what was verified, under which source state and environment, and what remains blocked. Publication, deployment and owner acceptance require their own evidence.

