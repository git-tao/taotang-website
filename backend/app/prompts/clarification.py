"""LLM prompt templates for AI Intake Assistant.

These prompts are used with Gemini 2.0 Flash for:
1. Trigger detection (contradictions, budget/scope mismatch)
2. Question generation (clarifying questions)
3. Intelligence gathering (optional post-qualification questions)
"""

# ============================================================================
# TRIGGER DETECTION PROMPTS
# ============================================================================

TRIGGER_DETECTION_SYSTEM = """You are an AI assistant analyzing client intake forms for a premium MLE/AI consulting practice.

Your task is to detect issues that need clarification BEFORE routing the lead:

1. **CONTRADICTION**: Conflict between structured answers and free-text description
   - Example: access_model="remote_access" but context mentions "on-premise only" or "highly secure environment"
   - Example: timeline="urgent" but context says "just exploring options"

2. **BUDGET_SCOPE_MISMATCH**: Project complexity exceeds stated budget
   - Example: Building a production RAG system with budget under $10k
   - Example: Full audit + refactor + deployment with budget $10k-$25k
   - Consider: production deployment, multi-system integration, enterprise scale → typically requires $25k+

Rules:
- Only flag issues with confidence >= 0.7
- Do NOT flag ambiguity (handled by rule-based detection)
- Be conservative: if uncertain, do not flag
- Focus on issues that would change the routing decision

Output JSON only, no explanation."""


TRIGGER_DETECTION_USER = """Analyze this intake form submission for contradictions or budget/scope mismatches:

**Form Data:**
- Name: {name}
- Role: {role_title}
- Is Decision Maker: {is_decision_maker}
- Service Type: {service_type}
- Timeline: {timeline}
- Budget Range: {budget_range}
- Access Model: {access_model}

**Project Description:**
{context_raw}

**Budget Reference:**
- under_10k: Small tasks, quick fixes, simple audits
- 10k_25k: Basic features, prototype improvements
- 25k_50k: Production deployments, comprehensive audits
- over_50k: Enterprise systems, complex integrations

Respond with JSON:
{{
  "has_issues": true/false,
  "issues": [
    {{
      "type": "contradiction" or "budget_scope_mismatch",
      "field": "field_name that needs clarification or null",
      "description": "Brief explanation of the issue",
      "confidence": 0.0 to 1.0
    }}
  ]
}}

If no issues detected, return: {{"has_issues": false, "issues": []}}"""


# ============================================================================
# QUESTION GENERATION PROMPTS
# ============================================================================

QUESTION_GENERATION_SYSTEM = """You are an AI assistant helping qualify consulting leads for a premium MLE/AI practice.

Generate ONE clarifying question to resolve an issue. Rules:

1. **ONE question at a time** - the most determinative one
2. **Direct enum mapping** - options must map to exact form field values
3. **Neutral framing** - never accuse the user of inconsistency
4. **Concise** - question text under 100 characters
5. **Options when possible** - easier for user than free text

Question priorities (ask in this order):
1. Budget clarification (affects qualification directly)
2. Access model clarification (affects qualification)
3. Service type clarification (affects routing)
4. Context clarification (if very sparse)

For budget questions, always use these exact options:
- "under_10k" → "Under $10,000"
- "10k_25k" → "$10,000 - $25,000"
- "25k_50k" → "$25,000 - $50,000"
- "over_50k" → "Over $50,000"
- "keep_current" → "Keep my current selection"

Output JSON only."""


QUESTION_GENERATION_USER = """Generate the next clarifying question.

**Current Form State:**
{form_state}

**Issues to Resolve:**
{issues}

**Session Progress:**
- Questions asked: {questions_asked}
- Questions remaining: {questions_remaining}

**Previous Q&A (if any):**
{previous_answers}

Respond with JSON:
{{
  "question_text": "The question to ask (under 100 chars)",
  "question_type": "single_choice" or "text" or "confirmation",
  "question_purpose": "Brief explanation shown to user (optional, under 50 chars)",
  "options": [
    {{
      "value": "unique_id",
      "label": "Display text",
      "description": "Optional helper text",
      "maps_to_field": "form_field_name or null",
      "maps_to_value": "the exact enum value to set"
    }}
  ],
  "target_field": "form field this resolves (budget_range, service_type, etc.)"
}}

For single_choice, provide 3-5 options. For text, omit options array."""


# ============================================================================
# INTELLIGENCE GATHERING PROMPTS
# ============================================================================

INTELLIGENCE_GATHERING_SYSTEM = """You are an AI assistant gathering optional technical details for a QUALIFIED consulting lead.

The lead has ALREADY passed qualification. This is optional information to help prepare for the strategy call.

Rules:
1. Keep it brief and non-invasive
2. Focus on technical context that helps call preparation
3. Make it feel valuable to the user ("to make our call productive")
4. One question only

Good topics:
- Current tech stack (LLM provider, vector DB, cloud platform)
- Project stage (prototype, staging, production)
- Primary success metric (latency, accuracy, cost, reliability)
- Key constraints (compliance, timeline, team size)

Output JSON only."""


# ============================================================================
# FALLBACK QUESTIONS (used when LLM fails)
# ============================================================================

FALLBACK_QUESTIONS = {
    "budget_range": {
        "question_text": "Which budget range best fits your project?",
        "question_type": "single_choice",
        "question_purpose": "Helps us recommend the right engagement",
        "target_field": "budget_range",
        "options": [
            {"value": "under_10k", "label": "Under $10,000", "maps_to_field": "budget_range", "maps_to_value": "under_10k"},
            {"value": "10k_25k", "label": "$10,000 - $25,000", "maps_to_field": "budget_range", "maps_to_value": "10k_25k"},
            {"value": "25k_50k", "label": "$25,000 - $50,000", "maps_to_field": "budget_range", "maps_to_value": "25k_50k"},
            {"value": "over_50k", "label": "Over $50,000", "maps_to_field": "budget_range", "maps_to_value": "over_50k"},
            {"value": "keep_current", "label": "Keep my current selection", "maps_to_field": None, "maps_to_value": None},
        ],
    },
    "service_type": {
        "question_text": "Which best describes what you're looking for?",
        "question_type": "single_choice",
        "question_purpose": "Helps us point you in the right direction",
        "target_field": "service_type",
        "options": [
            {"value": "audit", "label": "Audit my existing AI system", "maps_to_field": "service_type", "maps_to_value": "audit"},
            {"value": "project", "label": "Build or ship something new", "maps_to_field": "service_type", "maps_to_value": "project"},
            {"value": "advisory_paid", "label": "Get strategic advice", "maps_to_field": "service_type", "maps_to_value": "advisory_paid"},
        ],
    },
    "access_model": {
        "question_text": "How can external collaborators access your systems?",
        "question_type": "single_choice",
        "question_purpose": "Ensures we can work effectively together",
        "target_field": "access_model",
        "options": [
            {"value": "remote_access", "label": "Remote access to cloud/repos", "maps_to_field": "access_model", "maps_to_value": "remote_access"},
            {"value": "own_environment_own_tools", "label": "Sandboxed environment with our tools", "maps_to_field": "access_model", "maps_to_value": "own_environment_own_tools"},
            {"value": "managed_devices", "label": "Must use company-managed devices", "maps_to_field": "access_model", "maps_to_value": "managed_devices"},
            {"value": "onpremise_only", "label": "On-premise only, no remote access", "maps_to_field": "access_model", "maps_to_value": "onpremise_only"},
        ],
    },
    "context_raw": {
        "question_text": "Could you tell me more about your project?",
        "question_type": "text",
        "question_purpose": "Helps us understand your needs",
        "target_field": "context_raw",
        "options": None,
    },
}
