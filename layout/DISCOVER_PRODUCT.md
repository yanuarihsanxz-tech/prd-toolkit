---
layout: discover-product
version: "1.0.0"
mode: discovery
toolkit_root: ".."
default_output: "@project/DISCOVERY.md"
application_code_changes: forbidden
---

# Discover and Research a Product

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Use this before PRD generation when the idea, users, constraints, market,
technology, or success evidence is still uncertain. The output is a concise,
source-aware handoff for the PRD—not a second requirements document.

```text
Use the PRD toolkit at <toolkit-root>.

mode: discovery
project_root: @project
output_file: @project/DISCOVERY.md

idea:
  problem: "[Problem or opportunity]"
  intended_users:
    - "[Primary user or operator]"
  desired_outcome: "[Observable result]"
  known_constraints:
    - "[Platform, data, security, cost, timeline, or authority constraint]"
  owner_evidence:
    - "[Interview note, existing file, metric, incident, example, or assumption]"

instructions:
  - Inspect the target repository, existing documents, and applicable AGENTS.md first.
  - Read prompts/RESEARCH_AND_TOOL_ROUTING.md.
  - Separate observed facts, owner statements, external evidence, inferences, assumptions, and UNVERIFIED claims.
  - Research only questions that could materially change users, scope, requirements, architecture, compatibility, or verification.
  - Prefer current primary sources and record source title, direct URL, publication or retrieval date, supported claim, and material limitation.
  - Compare at most three viable solution shapes. Recommend the smallest shape that can achieve the stated outcome and explain the rejected material alternative.
  - Do not select a dependency because it is popular. Record why the capability is needed, what existing/local option was checked, setup and credential cost, failure mode, and exit path.
  - Create exactly six numbered sections: Problem and Outcome; Users and Jobs; Evidence Ledger; Solution Boundary; Decisions and Open Questions; PRD Handoff Summary.
  - In the PRD Handoff Summary, state must-have outcomes, constraints, explicit exclusions, risks, measurable success signals, assumptions, and every unresolved owner decision.
  - Write only @project/DISCOVERY.md. Do not create a PRD, TASKS.json, governance files, application code, dependencies, credentials, or external side effects.
  - If no external research was needed, say so and identify the local evidence used.
  - End with one verdict: READY_FOR_PRD, NEEDS_OWNER_INPUT, or NOT_YET_JUSTIFIED.
```
