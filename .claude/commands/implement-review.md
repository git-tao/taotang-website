# Implement Review - Implementation vs Plan Validation

When the user invokes `/implement-review`, become a rigorous implementation auditor that validates code changes against the approved plan. This command spins up **parallel specialized agents** to ensure the implementation doesn't drift or deviate from the plan.

## When to Use This Command

- After implementation is complete (or at checkpoints)
- Before merging implementation PR
- When you suspect implementation may have drifted from the plan
- As a final gate before deployment

## Your Task

Orchestrate a comprehensive review using parallel agents to validate:
1. **Plan Compliance**: Does the code match what the plan specified?
2. **Completeness**: Are all plan sections implemented?
3. **Correctness**: Does the implementation actually work?
4. **No Drift**: Has the implementation added/removed/changed things not in the plan?

---

## Phase 1: Gather Context

First, identify:

1. **The Plan Document**: Which document is the approved plan?
2. **The Implementation Changes**: What files were created/modified?
   - Use `git diff` or `git status` to find changes
   - Or ask user to specify the changes

```bash
# Gather implementation scope
git diff --name-only HEAD~N  # or specific commit range
git diff --stat HEAD~N
```

3. **The Handoff Context**: Was there an `/implement-instruct` handoff? What critical context was provided?

---

## Phase 2: Deploy Parallel Review Agents

Launch **ALL appropriate agents in parallel** based on what's being reviewed:

### Core Agents (Always Deploy)

```python
# Agent 1: Plan Compliance Auditor
Task(
    description="Audit plan compliance",
    prompt="""Review implementation against plan for compliance.

    PLAN: [plan document path]
    CHANGES: [list of changed files]

    For each plan section, verify:
    1. Is it implemented?
    2. Does implementation match plan specification?
    3. Any deviations or additions not in plan?

    Return:
    - COMPLIANT sections (with evidence)
    - DEVIATED sections (what's different and why it matters)
    - MISSING sections (not yet implemented)
    """,
    subagent_type="Explore"
)

# Agent 2: Critical Context Validator
Task(
    description="Validate critical context adherence",
    prompt="""Verify implementation follows critical context from handoff.

    Check for common mistakes:
    - Identity mappings (using correct ID references?)
    - Data structure access (nested paths correct?)
    - Required fields (all populated?)
    - Environment variables (all configured?)
    - Legacy data handling (old formats supported?)

    For each, cite file:line evidence of correct OR incorrect usage.
    """,
    subagent_type="Explore"
)

# Agent 3: Completeness Checker
Task(
    description="Check implementation completeness",
    prompt="""Verify all plan deliverables are implemented.

    PLAN: [plan document path]

    Create checklist:
    - [ ] Each component specified
    - [ ] Each code change specified
    - [ ] Each API endpoint specified
    - [ ] Each type/interface specified

    Mark complete or incomplete with file:line evidence.
    """,
    subagent_type="Explore"
)
```

### Domain-Specific Agents (Deploy Based on Change Type)

```python
# If changes include backend/API
Task(
    description="API endpoint validation",
    prompt="Validate API endpoints are correctly implemented...",
    subagent_type="Explore"
)

# If changes include React components
Task(
    description="React component review",
    prompt="Verify React components follow patterns and are correctly typed...",
    subagent_type="Explore"
)

# If changes include TypeScript types
Task(
    description="TypeScript type validation",
    prompt="Verify TypeScript types are complete and consistent...",
    subagent_type="Explore"
)

# If changes include styling
Task(
    description="UI/styling review",
    prompt="Verify UI changes match design requirements...",
    subagent_type="Explore"
)

# If changes include state management
Task(
    description="State management review",
    prompt="Verify state management is implemented correctly...",
    subagent_type="Explore"
)
```

### Architecture Alignment Agent (Always Deploy)

```python
# Agent: Alignment Check
Task(
    description="Architecture alignment review",
    prompt="""Check implementation against CLAUDE.md principles:

    1. Single source of truth maintained?
    2. No parallel systems created?
    3. Extending existing patterns (not creating new ones)?
    4. No anti-patterns?

    Return ALIGNED or MISALIGNED with specific violations.
    """,
    subagent_type="Explore"
)
```

---

## Phase 3: Consolidate Review Results

After all agents complete, synthesize into a structured report:

```markdown
# Implementation Review Report

**Plan:** [plan document]
**Implementation Scope:** [N files changed]
**Review Date:** [date]

---

## Executive Summary

| Category | Status | Issues |
|----------|--------|--------|
| Plan Compliance | ✅/⚠️/❌ | N issues |
| Critical Context | ✅/⚠️/❌ | N issues |
| Completeness | ✅/⚠️/❌ | N items missing |
| React/Components | ✅/⚠️/❌ | N concerns |
| TypeScript Types | ✅/⚠️/❌ | N mismatches |
| Architecture | ✅/⚠️/❌ | N violations |

**Overall Verdict:** APPROVE / REVISE / BLOCK

---

## Detailed Findings

### ✅ Compliant (No Action Needed)

1. **[Section/Feature]**: Implemented correctly per plan
   - Evidence: [file:line]

### ⚠️ Deviations (Review Required)

1. **[Section/Feature]**: Implementation differs from plan
   - **Plan said:** [what plan specified]
   - **Implementation does:** [what code actually does]
   - **Risk:** [potential impact]
   - **Recommendation:** [accept deviation / fix to match plan]

### ❌ Blocking Issues (Must Fix)

1. **[Issue]**: [Description]
   - **Evidence:** [file:line]
   - **Why Blocking:** [impact if not fixed]
   - **Fix Required:** [specific action]

### 📋 Missing Items (Not Yet Implemented)

1. **[Plan Section X]**: Not found in implementation
   - Expected: [what should exist]
   - Status: [intentionally deferred / forgotten / blocked]

---

## Recommendations

### Before Merging
1. [Specific action item]
2. [Specific action item]

### Before Deploying
1. [Specific action item]

### Follow-up Items
1. [Deferred work to track]

---

## Agent Reports

<details>
<summary>Plan Compliance Audit</summary>
[Full agent output]
</details>

<details>
<summary>Critical Context Validation</summary>
[Full agent output]
</details>

[...additional agent reports...]
```

---

## Agent Selection Matrix

| Change Type | Agents to Deploy |
|-------------|------------------|
| React components | Component review, TypeScript validation |
| API endpoints | API validation, Contract checking |
| State management | State review, Architecture alignment |
| Styling/UI | UI review, Component review |
| TypeScript types | TypeScript validation |
| All changes | Alignment, Completeness checking |

---

## Example Invocation

User: `/implement-review`

Agent:
1. Identifies plan document and implementation changes
2. Deploys 5-8 parallel review agents based on change types
3. Waits for all agents to complete
4. Synthesizes consolidated review report
5. Provides clear verdict: APPROVE / REVISE / BLOCK

---

## Verdicts

### APPROVE
- All plan sections implemented
- No blocking deviations
- Critical context followed correctly
- Safe to merge/deploy

### REVISE
- Minor deviations that need review
- Missing non-critical items
- Acceptable with documented exceptions

### BLOCK
- Critical plan sections missing
- Dangerous deviations from plan
- Breaking issues found
- Must fix before proceeding

---

## Integration with Implementation Workflow

```
/implement-instruct → Generates handoff
         ↓
[Implementation work in new session]
         ↓
/implement-review → Validates implementation
         ↓
    ┌────┴────┐
    ↓         ↓
 APPROVE    REVISE/BLOCK
    ↓         ↓
  Merge    Fix issues
             ↓
      /implement-review (again)
```

---

## Key Principles

1. **Parallel by Default**: Launch all relevant agents simultaneously
2. **Evidence-Based**: Every finding cites file:line references
3. **Plan-Centric**: The approved plan is the source of truth
4. **Actionable Output**: Clear verdict with specific fix actions
5. **Comprehensive**: Cover compliance, correctness, completeness, and alignment
