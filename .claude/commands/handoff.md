# Generate Session Handoff

You are ending a coding session and need to create a comprehensive handoff for the next session. This handoff captures everything important from the current session so nothing is lost.

## Your Task

Generate a handoff by gathering REAL context from the current session, NOT templates.

### Step 1: Gather Session Context

Collect this information from the CURRENT conversation and git state:

1. **Recent Git Activity** - Run these to understand what changed:
   ```bash
   git log --oneline -10
   git diff --stat HEAD~3..HEAD 2>/dev/null || git diff --stat
   git status --short
   ```

2. **From This Conversation** - Extract:
   - What was the user trying to accomplish?
   - What was completed?
   - What decisions were made?
   - What problems were encountered?
   - What files were modified or discussed?
   - What's left to do?

3. **Active Blockers** - Any issues preventing progress?

### Step 2: Write the Handoff File

Write a handoff to `.workflow/active/handoff.md` with this format:

```markdown
# Session Handoff

**Generated:** [CURRENT_ISO_TIMESTAMP]
**Session ID:** [UNIQUE_8_CHAR_ID]

---

## What We Were Working On

[1-3 sentences describing the session's main focus]

## What Was Accomplished

- [Specific accomplishment 1]
- [Specific accomplishment 2]
- [Specific accomplishment 3]

## Key Decisions Made

- **[Decision]:** [Brief rationale]

## Files Modified/Discussed

- [file1.ts](path/to/file1.ts) - [What changed or was discussed]
- [file2.tsx](path/to/file2.tsx) - [What changed or was discussed]

## Current Blockers

[List any blockers, or "None - ready to proceed"]

## What To Do Next

1. [Immediate next step]
2. [Following step]
3. [And so on]

## Quick Start for Next Session

To continue this work:
```bash
# Start here
cd /Users/taotang/projects/Tao AI SWE website
# Key command or file to open
[relevant command]
```

## Important Context

[Any critical context the next session needs to know - gotchas, constraints, things to watch out for]

---

**Tip:** Run `/handon` at the start of your next session to load this context.
```

### Step 3: Archive the Handoff

Also save a timestamped copy for history:

```bash
cp .workflow/active/handoff.md ".workflow/handoffs/handoff-$(date +%Y%m%d-%H%M%S).md"
```

### Step 4: Display Summary

After writing, show a summary:

```
🎯 Session Handoff Created

📋 Session Focus: [Brief description]

✅ Completed:
- [Item 1]
- [Item 2]

📁 Key Files:
- [file1.ts](path)
- [file2.ts](path)

🔜 Next Steps:
1. [Step 1]
2. [Step 2]

💾 Saved to:
- .workflow/active/handoff.md (current)
- .workflow/handoffs/handoff-[timestamp].md (archive)

💡 Next session: Run /handon to load this context
```

## Critical Rules

1. **DO NOT use templates with placeholders** - Write actual content from this session
2. **DO NOT depend on memory-keeper MCP** - Write directly to files
3. **DO extract real information** - From git, from conversation, from context
4. **DO be specific** - File paths, line numbers, exact decisions
5. **DO ask the user** if you're unsure what was accomplished

## If Context is Unclear

Ask the user:
- "What did we accomplish in this session?"
- "What should the next session focus on?"
- "Any blockers or issues to note?"

Then write the handoff based on their response.
