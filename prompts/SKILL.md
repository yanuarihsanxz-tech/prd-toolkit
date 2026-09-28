---
name: prd-generator
description: Compatibility entry for the PRD Maker. Generate, improve, review, or build from a PRD using the operation requested by the user.
---

# PRD Maker Compatibility Entry

Read [the canonical PRD Maker skill](../SKILL.md) and follow exactly the operation
the user requested. This path remains for existing agent adapters and references;
it does not define a second workflow.

Research-only requests remain read-only. PRD generation does not implement code.
New local builds use the host's native plan by default. Existing toolkit runner
plans/states retain their recorded approval, failure, and recovery contracts.
