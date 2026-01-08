# Implement Instruct - Implementation Handoff Generator

When the user invokes `/implement-instruct`, generate a comprehensive handoff prompt that enables a fresh agent session to implement an approved plan. This command is used after validation rounds are complete and the plan is ready for execution.

## When to Use This Command

- After multiple rounds of plan validation (planning cycles complete)
- When a plan document is approved and ready for implementation
- Before handing off to a new agent session for execution
- For large features, migrations, or surgical refactoring work

## Your Task

Generate a **copy-paste ready** implementation handoff prompt that includes:

### 1. Mission Statement
- Clear 1-2 sentence description of what's being implemented
- Reference to the plan document location
- Confirmation that the plan has been validated/approved

### 2. The Problem Being Solved
- Root cause explanation (why this work is needed)
- Current state vs desired state
- Business impact if not addressed

### 3. Critical Context Not Obvious From Plan

**This is the most important section.** Research and document:

- **Identity/Reference Mappings**: Which IDs reference what? (e.g., `user_id = users.id`, NOT `other_table.id`)
- **Data Structure Nuances**: Nested JSON paths, non-obvious field locations
- **Valid Values/Enums**: What are the valid status values, type enums?
- **Required Fields**: Fields that will fail if not populated
- **Legacy Data Formats**: Old vs new data formats that need handling
- **Timing/Order Dependencies**: What must happen before what?
- **Environment Setup**: Required env vars, API keys, configuration

For each critical context item, include:
- The specific gotcha or non-obvious detail
- File:line evidence from the codebase
- Example of correct vs incorrect usage

### 4. How to Read the Plan

- Section map with implementation order
- Key sections to focus on first
- Complex logic explanations (break down dense code in the plan)

### 5. Files Reference

| Category | Files | Purpose |
|----------|-------|---------|
| **Create** | New files to create | What they contain |
| **Modify** | Existing files to change | What changes needed |
| **Reference** | Files for context only | Why they matter |

### 6. Validation Checklist

Concrete checkboxes the implementing agent should verify before considering work complete.

### 7. Quick Start Commands

```bash
# Actual commands to orient the agent
cd /Users/taotang/projects/Tao AI SWE website
cat path/to/plan.md
# Other helpful commands...
```

### 8. What NOT to Do

Explicit anti-patterns discovered during validation rounds. These are the mistakes that were caught and corrected - prevent the implementing agent from making them again.

---

## Research Process

Before generating the handoff:

1. **Identify the plan document** - Ask if not clear which document is the approved plan
2. **Read the plan** - Understand structure, sections, key logic
3. **Search for evidence** - Find file:line references for critical context
4. **Recall validation history** - What issues were found and fixed during planning rounds?
5. **Identify non-obvious details** - What would trip up an agent reading only the plan?

## Output Format

Generate the handoff as a markdown document that can be:
- Copy-pasted directly into a new Claude Code session
- Self-contained (no external context needed)
- Actionable (agent can start implementing immediately)

Structure:

```markdown
# [Feature Name] - Implementation Handoff

## Your Mission
[1-2 sentences + plan location]

## The Problem Being Solved
[Root cause, current vs desired state]

---

## Critical Context You Need (Not Obvious From Plan)

### 1. [First Critical Detail]
[Explanation with file:line evidence]

### 2. [Second Critical Detail]
[Explanation with file:line evidence]

[...continue for all critical details...]

---

## How to Read the Plan

### Section Map
[Table of sections with implementation order]

### Key Logic Explained
[Break down complex parts]

---

## Files You'll Modify

### New Files to Create
- `path/to/new/file.ts` - [Purpose]

### Existing Files to Modify
- `path/to/existing.tsx` - [What changes]

### Files for Reference (Don't Modify)
- `path/to/reference.ts` - [Why it matters]

---

## Validation Checklist

- [ ] [Concrete verification step]
- [ ] [Another verification step]

---

## Quick Start Commands

```bash
cd /Users/taotang/projects/Tao AI SWE website
# Helpful commands...
```

---

## What NOT to Do

1. **Don't [anti-pattern]** - [Why it's wrong]
2. **Don't [anti-pattern]** - [Why it's wrong]

---

**Good luck! The plan is solid. Follow it exactly.**
```

## Example Invocation

User: `/implement-instruct`

Agent:
1. Identifies the current plan document from conversation context
2. Reads the plan to understand structure
3. Researches codebase for critical context details
4. Recalls validation issues from planning rounds
5. Generates comprehensive handoff prompt
6. Outputs ready-to-copy markdown

## Key Principles

- **Self-Contained**: The handoff must work without conversation history
- **Evidence-Based**: Every critical detail cites file:line references
- **Actionable**: Agent can start implementing immediately after reading
- **Preventive**: Anti-patterns section prevents repeating past mistakes
- **Ordered**: Clear sequence of what to do first, second, etc.

## Integration with Planning

This command is the natural endpoint after planning/validation cycles:

```
[Plan created]
     ↓
[Plan validation feedback] → Fixes applied
     ↓
[More validation rounds]
     ↓
"Plan approved!"
     ↓
/implement-instruct → Generates handoff prompt
     ↓
[Copy to new session for implementation]
```
