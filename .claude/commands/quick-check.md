# Quick Check - Real-Time Decision Validation Command

*"Trust, but verify"* - Use this command to validate ad-hoc decisions during debugging and development.

When the user invokes `/quick-check`, you become a **decision validation orchestrator** that immediately spins up parallel agents to scrutinize the current decision being made.

## Purpose

This command exists because:
- Ad-hoc debugging decisions are made quickly without full consideration
- The broader feature context is often lost in the heat of debugging
- Backwards compatibility implications are easy to miss
- Best practices from CLAUDE.md and project patterns get overlooked
- A quick sanity check can prevent hours of rework

## When to Use

Invoke `/quick-check` when:
- You're about to implement a fix and want validation
- A debugging decision feels risky or uncertain
- You want to verify alignment with the feature plan
- You're unsure if a solution respects backwards compatibility
- The approach seems like it might create technical debt

## Execution Protocol

### Phase 1: Context Extraction (Immediate)

**Automatically extract from conversation history:**

1. **THE PROBLEM**: What bug/issue is being debugged?
2. **THE PROPOSED SOLUTION**: What fix/approach is about to be implemented?
3. **THE DECISION POINT**: What specific decision triggered this check?
4. **AFFECTED CODE**: Which files/functions are being modified?
5. **FEATURE CONTEXT**: What broader feature is this part of?

Output:
```markdown
## Quick Check Initiated

### Context Extracted

**Problem:** [What's broken or being addressed]
**Proposed Solution:** [The fix being considered]
**Decision Point:** [The specific decision being made]
**Affected Files:** [List of files]
**Feature Context:** [Broader feature this serves]
```

### Phase 2: Parallel Validation Agents (5+ agents simultaneously)

Deploy these agents **IN PARALLEL** in a **SINGLE MESSAGE**:

```python
# ALL of these Task calls should be in ONE message for parallel execution

# Agent 1: Feature Plan Alignment
Task(
    description="Feature plan alignment check",
    prompt="""QUICK CHECK: Feature Plan Alignment

**Proposed Fix:** [extracted from context]
**Problem:** [extracted from context]

Search for relevant plan documents:
- Personal Website PRD V1.md
- Any docs/*.md that match the feature area
- .workflow/active/*.md for current context

Questions to answer:
1. Does this fix align with the documented feature plan?
2. Does it conflict with any planned approach?
3. Is this the right layer/component for this fix?

Return: ALIGNED / MISALIGNED / NEEDS_REVIEW with specific plan references.""",
    subagent_type="Explore"
)

# Agent 2: CLAUDE.md Best Practices
Task(
    description="Best practices validation",
    prompt="""QUICK CHECK: CLAUDE.md Best Practices

**Proposed Solution:** [extracted from context]
**Affected Files:** [extracted from context]

Read CLAUDE.md and check:
1. Anti-patterns - Does this create parallel systems? Over-engineering?
2. Working systems - Does this touch a protected system?
3. Development principles - Does this follow project conventions?

Return: COMPLIANT / VIOLATIONS_FOUND / WARNING with specific CLAUDE.md section citations.""",
    subagent_type="Explore"
)

# Agent 3: Backwards Compatibility
Task(
    description="Backwards compatibility check",
    prompt="""QUICK CHECK: Backwards Compatibility

**Proposed Change:** [extracted from context]
**Affected Code:** [extracted from context]

Analyze for breaking changes:
1. API signatures - Any parameter changes that break callers?
2. Database schema - Any migrations needed? Additive only?
3. Frontend contracts - Any endpoint URL/response shape changes?
4. Existing data - Will existing records still work?

Search for usages of the modified code:
- grep for function/method names
- Find all callers/importers
- Check for external API consumers

Return: SAFE / BREAKING_CHANGES / NEEDS_MIGRATION with specific impacts listed.""",
    subagent_type="Explore"
)

# Agent 4: Scope Creep Detection
Task(
    description="Scope creep detection",
    prompt="""QUICK CHECK: Scope & Complexity Analysis

**Original Problem:** [extracted from context]
**Proposed Solution:** [extracted from context]

Evaluate:
1. Is this the minimal fix for the problem?
2. Does the solution do more than necessary?
3. Are we fixing symptoms vs root cause?
4. Could a simpler approach work?
5. Are we adding complexity that won't be needed?

Return: MINIMAL / OVER_ENGINEERED / UNDER_ENGINEERED with rationale.""",
    subagent_type="Explore"
)

# Agent 5: Architecture Impact
Task(
    description="Architecture impact assessment",
    prompt="""QUICK CHECK: Architecture Impact

**Proposed Change:** [extracted from context]
**Files Affected:** [extracted from context]

Assess architectural implications:
1. Does this maintain separation of concerns?
2. Are we modifying the right layer (API/Service/Component)?
3. Does this introduce tight coupling?
4. Will this scale if usage increases 10x?
5. Does this follow existing patterns in the codebase?

Search for similar patterns in codebase and compare.

Return: SOUND / CONCERNS / REFACTOR_NEEDED with specific architectural issues.""",
    subagent_type="Explore"
)

# Agent 6: TypeScript/React Patterns (if applicable)
Task(
    description="TypeScript/React patterns check",
    prompt="""QUICK CHECK: TypeScript/React Patterns

**Problem:** [extracted from context]
**Solution:** [extracted from context]

If this touches React components or TypeScript:
1. Are types properly defined?
2. Are React hooks used correctly?
3. Is state management appropriate?
4. Are there any anti-patterns (prop drilling, unnecessary re-renders)?

If not applicable, return: NOT_APPLICABLE

Return: CORRECT / PATTERN_ERROR / NOT_APPLICABLE with specific references.""",
    subagent_type="Explore"
)

# Agent 7: API Contract Validation (if API changes)
Task(
    description="API contract check",
    prompt="""QUICK CHECK: API Contract Validation

**Proposed Change:** [extracted from context]

If this modifies API endpoints or frontend service calls:
1. Does the frontend call match the backend endpoint?
2. Are request/response types aligned?
3. Is the endpoint path correct?
4. Are query params and body fields matching?

If not API-related, return: NOT_APPLICABLE

Return: CONTRACTS_VALID / MISMATCH_FOUND / NOT_APPLICABLE with specific mismatches.""",
    subagent_type="Explore"
)
```

### Phase 3: Verdict Synthesis

After all parallel agents return, synthesize:

```markdown
## Quick Check Verdict

### Summary Table

| Dimension | Agent | Status | Key Finding |
|-----------|-------|--------|-------------|
| Feature Alignment | Explore | ✅/⚠️/❌ | [1-line summary] |
| Best Practices | Explore | ✅/⚠️/❌ | [1-line summary] |
| Backwards Compat | Explore | ✅/⚠️/❌ | [1-line summary] |
| Scope/Complexity | Explore | ✅/⚠️/❌ | [1-line summary] |
| Architecture | Explore | ✅/⚠️/❌ | [1-line summary] |
| TS/React Patterns | Explore | ✅/⚠️/❌/N/A | [1-line summary] |
| API Contracts | Explore | ✅/⚠️/❌/N/A | [1-line summary] |

### Overall Verdict: APPROVE / NEEDS_REVIEW / BLOCK

### If APPROVE ✅
Proceed with the proposed solution. Evidence:
- [Key alignment point 1]
- [Key alignment point 2]

### If NEEDS_REVIEW ⚠️
Consider before proceeding:
1. [Concern 1] - [Suggested mitigation]
2. [Concern 2] - [Question to resolve]

### If BLOCK ❌
Do NOT proceed. Critical issues:
1. **[Issue Category]**: [Specific problem]
   - Evidence: [file:line or doc reference]
   - Required fix: [What to do instead]

### Questions for You (User)
1. [Clarifying question if decision is ambiguous]
2. [Alternative approach to consider?]

### Confidence Score: X/10
[Brief rationale for confidence level]
```

## Rapid Mode

If the user runs `/quick-check fast`, run only 3 critical agents in parallel:

1. **Feature Alignment** (Explore)
2. **Best Practices** (Explore)
3. **Backwards Compatibility** (Explore)

Output a condensed verdict within 30 seconds.

## Example Usage

### Scenario: Debugging a component issue

User is debugging why a React component fails and about to add error boundary.

```
/quick-check
```

**Context Extracted:**
- Problem: Component crashes on undefined data
- Solution: Add error boundary wrapper
- Decision: Create new ErrorBoundary component

**Parallel Validation:**
- Feature Alignment: ✅ Error handling is good practice
- Best Practices: ⚠️ Check if error boundary already exists
- Backwards Compat: ✅ Additive change
- Scope: ⚠️ Could be simpler - null check might suffice
- Architecture: ✅ Error boundaries are React best practice

**Verdict: NEEDS_REVIEW**
- Consider simpler null check first
- Check if ErrorBoundary already exists in codebase

## Key Principles

1. **Speed over perfection** - Quick feedback is more valuable than exhaustive analysis
2. **Parallel by default** - All validation agents run simultaneously
3. **Evidence-based** - Every finding must cite code or documentation
4. **Actionable output** - Clear APPROVE/NEEDS_REVIEW/BLOCK with next steps
5. **Context-aware** - Extracts from conversation, doesn't ask redundant questions

## The Philosophy

Quick Check exists because the best time to catch a mistake is BEFORE the code is written. A 30-second validation can save 3 hours of debugging the consequences of a bad decision.

*"Measure twice, cut once."*
