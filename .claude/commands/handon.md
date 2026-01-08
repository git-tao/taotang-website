# Quick Handoff Load

Load context from the previous session to ramp up quickly.

## Your Task

Read the handoff file and present context in a digestible format.

### Step 1: Load Handoff File

```bash
cat .workflow/active/handoff.md
```

### Step 2: Check Handoff Freshness

Look at the **Generated:** timestamp:
- Less than 24 hours: Current context
- 1-7 days: Recent, may need updates
- Older than 7 days: Warn - context may be stale

### Step 3: Supplement with Git

```bash
git log --oneline -10
git status --short
git branch --show-current
```

### Step 4: Present Context

```
🔄 Loading Session Context...

📅 Last handoff: [timestamp] ([X hours/days ago])
🌿 Branch: [current branch]

🎯 What We Were Working On:
[From handoff]

✅ What Was Done:
- [Accomplishment 1]
- [Accomplishment 2]

💡 Key Decisions:
- [Decision 1]

📁 Key Files:
- [file1.ts](path)

⚠️ Blockers: [From handoff or "None"]

🔜 NEXT STEPS:
1. [Next step 1]
2. [Next step 2]

📊 Recent commits:
[Last 5 from git log]

💡 Ready to continue!
```

### Step 5: Handle Missing/Stale Handoff

**If no valid handoff:**
```
⚠️ No valid handoff found
Let me gather context from git instead:
[Show git log and status]
Run /handoff at session end to create one.
```

**If stale (>7 days):**
```
⚠️ Handoff is [X] days old - may be outdated.
Recent git activity: [Show commits]
Run /handoff at session end to update.
```

## Critical Rules

1. Read directly from .workflow/active/handoff.md - No MCP
2. Check freshness - Warn if stale
3. Supplement with git - Always current truth
4. Present concisely - Quick context

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/handon` | Load context (this) |
| `/handoff` | Save context at session end |
