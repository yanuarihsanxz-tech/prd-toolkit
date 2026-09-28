---
document_type: prompt-layout-index
version: "2.0.0"
language: en
---

# PRD Prompt Layouts

Most users reference the toolkit folder; root `SKILL.md` selects the operation.
Use this menu for an explicit single-purpose operation.

| Operation | Layout | Writes application code? |
|---|---|---:|
| Persist brainstorming/research for a later conversation when a durable evidence handoff is needed | `DISCOVER_PRODUCT.md` | No |
| Create a new PRD | `GENERATE_PRD.md` | No |
| Audit without editing, with structural preflight and evidence scoring | `VALIDATE_PRD.md` | No |
| Audit, structurally revalidate, and improve the PRD | `IMPROVE_PRD.md` | No |
| Create an explicitly requested schema-v2 stateful runner plan | `GENERATE_TASKS.md` | No |
| Build from a completed PRD; native plan by default, runner when requested/existing | `EXECUTE_TASKS.md` | Yes, continuously within authorized scope |
| Audit current code against every PRD requirement without repairing it | `AUDIT_IMPLEMENTATION.md` | No |

Replace `@project` with the attached project directory and complete only the
input fields relevant to the selected layout.
