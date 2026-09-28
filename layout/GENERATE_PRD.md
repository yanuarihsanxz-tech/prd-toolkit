---
layout: generate-prd
version: "3.0.2"
mode: generate
toolkit_root: ".."
default_output: "@project/PRD.md"
application_code_changes: forbidden
---

# Generate a PRD

Resolve `<toolkit-root>` to the parent of this file's `layout/` directory,
regardless of the target project or shell working directory. Substitute that
absolute path before running commands; quote paths containing spaces.


Use the current brainstorming/research conversation directly. Supply only a
missing product name or target folder; no separate questionnaire is required.
The [generator](../prompts/PRD_GENERATOR_PROMPT.md) owns the procedure and selects
one template. Do not load other operation layouts or copy their instructions.

```text
Use <toolkit-root> to prepare the PRD from this conversation.
```

The generator automatically selects the template, infers the target and product
change context, writes the specification companions, validates, and returns a
summary plus the saved product flowchart. No application implementation is part
of this operation. An explicit analysis-only request takes precedence.
