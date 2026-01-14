# Feature Implementation: The Context-Aware AI Intake Assistant

## 1. Overview and Core Principles

This document provides a detailed implementation plan for an AI assistant designed to enhance the lead intake process for a premium MLE/AI consulting practice. This AI is not a simple chatbot; it is a **context-aware intelligence layer** that activates situationally to clarify ambiguities, resolve contradictions, and gather critical scope information.

### 1.1. The AI's Mandate

The AI's primary role is to act as an intelligent scout and clarifier, ensuring that the data used for lead qualification is accurate and comprehensive. It serves three main functions:

1.  **Clarify Ambiguity**: Fill in missing or unclear information from the initial form submission.
2.  **Resolve Contradictions**: Detect and resolve conflicts between structured answers and free-text descriptions.
3.  **Gather Intelligence**: Collect high-value scope details to prepare the consultant for client calls.

### 1.2. Guiding Principles

The AI's behavior must adhere to the following principles to maintain a premium, respectful, and effective user experience.

| Principle | Description |
| :--- | :--- |
| **Situational Activation** | The AI is **not always on**. It activates only when the backend detects a specific, predefined trigger (e.g., ambiguity, contradiction). Otherwise, the user experience is a standard form submission. |
| **Deterministic Gating** | The AI **does not make routing decisions**. It provides clean, validated data to the backend's deterministic gating engine, which then decides to route the lead to a free call, paid session, or manual review. |
| **User-Confirmed Overrides** | The AI **can override a user's initial form answers**, but *only* after asking a neutral confirmation question and receiving an explicit confirmation from the user. All overrides are logged for transparency. |
| **Respectful & Premium Tone** | The AI's questions must be concise, intelligent, and framed to be helpful. There are **no "skip" buttons**. The interaction should feel like a brief, insightful conversation with a sharp assistant, not a hurdle. |
| **Advisory, Not Decisive** | The AI can flag risks (e.g., budget/scope mismatch) in its notes for the consultant, but it never presents these judgments to the user or uses them to directly alter routing. |


## 2. AI Activation Triggers

The AI should remain dormant unless one of the following server-side triggers is detected after the initial form submission. These triggers are categorized into **four distinct scenarios**.

| Trigger Category | Condition | Detection Method | Rationale |
| :--- | :--- | :--- | :--- |
| **Ambiguity** | One or more of the following fields has a low-signal value: `service_type` is `unclear`, `budget_range` is `unsure`, `access_model` is `unsure`, `role_title` is `ic_engineer` or `other` with `is_decision_maker` unset, or `context_raw` is less than 100 characters. | **Rule-based** | The initial submission lacks sufficient information to make a confident gating decision. The AI must intervene to clarify these specific fields. |
| **Contradiction** | The backend detects a logical conflict between a structured answer and the free-text `context_raw`. For example, `access_model` is `remote_access` but the context mentions a "highly secure, on-premise environment." | **Hybrid** (rules for known conflicts + LLM to propose candidates, backend validates before asking user) | The submitted data is unreliable. The AI must intervene to resolve the discrepancy and obtain the user's true intent before the gating rules can be trusted. |
| **Budget/Scope Mismatch** | The described project complexity appears to exceed the selected budget. Detected via heuristics (e.g., "production deployment" + budget < $25k) or LLM analysis. | **First-class trigger** (heuristic + LLM) | The budget may be unrealistic for the scope. The AI should offer concrete budget tier options (mapped directly to `budget_range` enum values) rather than an ambiguous "flexible" flag. |
| **Intelligence Gathering** | The lead has already passed the deterministic gate for a **free strategy call** AND question budget remains. | **Post-gate check** | The lead is qualified, but additional technical details would help the consultant be better prepared for the call. Only triggered if it won't consume question slots needed for gating. |

### 2.1. Trigger Detection Failure Handling

- **Rule-based triggers** always fire regardless of LLM availability.
- **LLM-based triggers** (contradiction, budget/scope mismatch): If LLM fails or returns invalid response, do NOT silently skip AI analysis. Instead:
  - If rule-based triggers exist → proceed with AI clarification
  - If ONLY LLM triggers would have existed → route to `manual` with note "LLM analysis unavailable"
- This ensures we never miss a potentially problematic submission due to LLM downtime.


## 3. AI Conversational Flows

Once triggered, the AI will initiate a short, focused chat session. The flow of this conversation is determined by the trigger category. The AI should ask a maximum of **3 questions** in total to avoid user fatigue.

| Scenario | AI Behavior and Questioning Strategy |
| :--- | :--- |
| **Scenario A: Ambiguity** | The AI asks 1-2 direct, clarifying questions to resolve the specific low-signal inputs. The goal is to convert an "unsure" answer into a concrete selection. <br><br> **Example (`budget_range` is `unsure`):**<br> *"To help recommend the best path forward, could you provide a rough budget range for this initiative?"* <br> (Presents the original budget options) |
| **Scenario B: Contradiction** | The AI asks a single, neutral confirmation question that presents the conflicting options without accusing the user of inconsistency. The user's choice **overrides** the original form submission. <br><br> **Example (`access_model` vs. `context_raw` conflict):**<br> *"Thanks for the context. To ensure we plan correctly, could you clarify which of these best describes your work environment for external collaborators?"* <br> (Presents `remote_access`, `managed_devices`, etc., as clear options) |
| **Scenario C: Budget/Scope Mismatch** | The AI detects that the described project complexity seems to exceed the selected budget. It asks a single, respectful question that maps **directly to `budget_range` enum values** (not an ambiguous "flexible" flag). <br><br> **Example:**<br> *"Based on the project scope described, this typically requires a larger investment. Which budget range would work for your team?"* <br> **Options (direct enum mapping):** <br> • Under $10,000 → `under_10k` <br> • $10,000 - $25,000 → `10k_25k` <br> • $25,000 - $50,000 → `25k_50k` <br> • Over $50,000 → `over_50k` <br> • Keep current selection → no update <br><br> If user selects a higher tier than originally submitted, update `budget_range` AND log a `budget_upgraded` note. If they select "Keep current selection," retain original value and route via normal gate logic. |
| **Scenario D: Intelligence Gathering** | After a lead is qualified (or after ambiguity/contradiction is resolved for a qualified lead), the AI asks 1-2 optional, high-value questions to gather technical details for call preparation. <br><br> **Example:**<br> *"This is very helpful. To make our strategy call as productive as possible, could you briefly share your current tech stack? (e.g., LLM provider, vector DB, orchestration framework)"* |


## 4. AI Output and Data Model

After the chat session concludes, the AI must produce a structured output that can be stored and used by the backend. This output should be logged in a dedicated `inquiry_events` or `ai_clarifications` table, linked to the original inquiry.

### 4.1. Structured JSON Output

The AI's final output for each interaction should be a JSON object containing the following fields:

```json
{
  "clarifications": [
    {
      "field": "access_model",
      "original_value": "remote_access",
      "clarified_value": "managed_devices",
      "user_confirmed": true,
      "trigger_reason": "contradiction_detected",
      "question_asked": "To ensure we plan correctly, could you clarify which of these best describes your work environment..."
    }
  ],
  "intelligence_gathered": {
    "tech_stack": "OpenAI GPT-4, Pinecone, LangChain, running on AWS Lambda",
    "project_stage": "In production, but experiencing performance issues",
    "success_metric": "Reducing p95 latency for RAG responses"
  },
  "ai_pre_call_notes": {
    "summary": "The user is running a production RAG system on AWS but is facing latency issues. They initially selected remote access but confirmed a managed device policy, which moves them to manual review. The budget is qualified.",
    "detected_risks": [
      {
        "risk_type": "access_model_mismatch",
        "description": "Initial selection of 'remote_access' was corrected to 'managed_devices', indicating a potential mismatch with standard operating procedures.",
        "severity": "medium"
      }
    ]
  }
}
```

### 4.2. Data Field Descriptions

| Field | Description |
| :--- | :--- |
| `clarifications` | An array of objects, where each object details a field that was updated by the AI after user confirmation. This provides a clear audit trail of changes. |
| `intelligence_gathered` | A structured object containing the answers to the high-value scope questions. This data is for the consultant's preparation, not for gating. |
| `ai_pre_call_notes` | A JSON object containing a human-readable summary and a list of detected risks or flags. This is the primary artifact for the consultant to review before a call or manual review. |

## 5. Implementation Plan

### 5.1. Backend Logic

1.  **Analysis Service**: After the initial `/intake` form submission, a service should run to analyze the submission against the defined triggers (ambiguity, contradiction, budget/scope mismatch, intelligence gathering).
2.  **Provisional Gate Status**: When `needs_clarification: true`, the initial gate result is **provisional** and should NOT be displayed to the user. Return `provisional_gate_status` in the response; final routing is determined only after clarification completes.
3.  **AI Trigger**: If a trigger is met, the backend should return:
    - `needs_clarification: true`
    - `ai_session_id`: UUID of the created AI session
    - `first_question`: The first clarification question to display
    - `provisional_gate_status`: What the gate would return without clarification (for logging only)
4.  **LLM Service**: A dedicated service will manage the conversation with the user, using Gemini 2.0 Flash (`gemini-2.0-flash`) with carefully designed prompts.
5.  **Data Persistence**:
    - **Per-turn**: Store question, answer, field updates, and raw LLM response (excluding chain-of-thought) in `ai_turns` table.
    - **Final output**: Built by backend (not LLM) when session completes. Includes `clarifications`, `intelligence_gathered`, and `ai_pre_call_notes`.
6.  **Re-Gating**: After each AI answer, re-run the deterministic gating logic in the background. If gate passes, session can resolve early.

### 5.2. Session & TTL Management

- **Session TTL**: 30 minutes of idle time (configurable via `ai_session_ttl_minutes`)
- **Server-side state**: All session state stored in `ai_sessions` table
- **Keep-alive**: Client can send heartbeats to reset idle timer while user is thinking

### 5.3. Frontend Logic

1.  **Conditional UI**: The frontend should be prepared to switch from a standard "thank you" page to a chat interface if the backend returns `needs_clarification: true`.
2.  **Form-to-Chat Transition**: The form should animate/morph into the card-based Q&A interface within the same container (fade out form, fade in question card).
3.  **Chat Interface**: The chat UI should be clean, professional, and focused, presenting one question at a time in a card format.
4.  **Final Outcome**: After the chat is complete and the backend has made its final routing decision, the frontend should display the appropriate outcome (free call link, paid session link, or manual review message).


## 6. LLM Prompt Design

The effectiveness of the AI assistant depends on a well-crafted system prompt that defines its role, constraints, and behavior. Below is the recommended prompt structure.

### 6.1. System Prompt

```
You are an intake assistant for a premium MLE/AI consulting practice. Your role is to clarify ambiguous or conflicting information from a client intake form and to gather key technical details to help prepare for client calls.

Your responsibilities:
1. Ask ONE clear, concise question at a time.
2. Never make routing decisions, pricing decisions, or eligibility judgments.
3. Never accuse the user of inconsistency or error. Frame all questions as helpful clarifications.
4. When a contradiction is detected, present the options neutrally and ask the user to confirm which is correct.
5. After receiving an answer, extract structured data and update the relevant field.
6. Stop after a maximum of 3 questions to avoid user fatigue.

Your constraints:
- You cannot decide whether a lead qualifies for a free call or paid session.
- You cannot promise availability, pricing, or timelines.
- You cannot collect sensitive personal data beyond what is necessary for project scoping.
- If the user asks about pricing or scheduling, acknowledge briefly and return to the intake question.

Your tone:
- Professional, respectful, and concise.
- Frame questions as being in the user's best interest ("to help us recommend the best path," "to ensure we plan correctly").
- No jargon or overly technical language unless the user has already used it.
```

### 6.2. Developer Instructions (Appended to System Prompt)

```
Developer instructions:
- Only ask about fields that are missing, ambiguous, or contradictory.
- Use the exact enum values from the schema when presenting options.
- If a contradiction is detected between a structured answer and free text, ask a confirmation question and override the field only if the user confirms.
- For intelligence gathering, ask about: tech stack, project stage, success metrics, or constraints.
- Output your response as a JSON object with the following structure:
  {
    "next_question": "The question text to present to the user",
    "expected_field": "The schema field this question is clarifying",
    "answer_options": ["Option 1", "Option 2", "Option 3"],
    "internal_reasoning": "Why this question is being asked (not shown to user)"
  }
```

### 6.3. User Context Template (Passed to LLM)

For each question, the backend should provide the AI with the current state of the intake:

```
Current intake state:
{
  "name": "Jane Doe",
  "email": "jane@techcorp.com",
  "company": "TechCorp",
  "role_title": "vp_director",
  "service_type": "prototype_to_production",
  "context_raw": "We have a RAG prototype in Jupyter notebooks and need to move it to production on AWS.",
  "timeline": "urgent",
  "budget_range": "10k_25k",
  "access_model": "remote_access"
}

Detected issues:
- Contradiction: access_model is "remote_access" but context_raw mentions "highly secure environment" which may imply restricted access.
- Budget/scope mismatch: The described project (prototype to production on AWS) typically requires a budget above $25k.

Gate criteria:
- business_email: required
- access_model: must be remote_access or own_environment_own_tools
- timeline: urgent or soon
- budget_range: >= 25k_50k
- senior_role: founder_csuite, vp_director, eng_manager
- context_raw: >= 100 characters

Your task:
Ask the next best question to resolve the detected issues. Prioritize contradictions, then ambiguity, then intelligence gathering.
```

## 7. Example Clarifying Questions

Below are examples of well-crafted questions for each scenario, designed to be respectful, concise, and effective.

### 7.1. Ambiguity Resolution

| Ambiguous Field | Example Question |
| :--- | :--- |
| `service_type` is `unclear` | "To point you in the right direction, which of these best describes what you're looking for? <br> • A diagnostic audit of an existing system <br> • Help building or productionizing a new system <br> • A paid advisory session to explore options" |
| `budget_range` is `unsure` | "To help recommend a realistic path forward, could you provide a rough budget range for this initiative? <br> • Under $10,000 <br> • $10,000 - $25,000 <br> • $25,000 - $50,000 <br> • Over $50,000" |
| `access_model` is `unsure` | "To ensure we can work effectively together, which of these best describes your environment for external collaborators? <br> • External collaborators can use their own tools with access to our repos/cloud <br> • We provide a sandboxed environment with our own tools <br> • External collaborators must use company-managed devices <br> • Our systems are on-premise only" |

### 7.2. Contradiction Resolution

| Contradiction Type | Example Question |
| :--- | :--- |
| `access_model` vs. `context_raw` | "Thanks for the details. To make sure we plan correctly, could you confirm which of these best reflects your setup? <br> • I can grant remote access to our cloud environment and repos <br> • We can provide an isolated environment with our tools <br> • External collaborators must use our managed devices <br> • Our systems are on-premise and cannot be accessed remotely" |
| `budget_range` vs. project complexity | "Based on the scope you've described, this typically requires a larger investment. Which budget range would work for your team? <br> • Under $10,000 <br> • $10,000 - $25,000 <br> • $25,000 - $50,000 <br> • Over $50,000 <br> • Keep my current selection" <br><br> *(Options map directly to `budget_range` enum values)* |

### 7.3. Intelligence Gathering

| Information Type | Example Question |
| :--- | :--- |
| Tech stack | "This is very helpful. To make our strategy call as productive as possible, could you briefly share your current tech stack? (e.g., LLM provider, vector database, orchestration framework, cloud infrastructure)" |
| Project stage | "Where is the system today? <br> • Early prototype (Jupyter notebooks, local scripts) <br> • Containerized and in staging <br> • Already in production" |
| Success metric | "What's the top success metric for this project? <br> • Latency / speed <br> • Accuracy / quality <br> • Cost reduction <br> • Reliability / uptime" |


## 8. Decision Logic After AI Interaction

After the AI chat concludes and the data has been updated, the backend must re-run the deterministic gating logic. The AI's role is complete at this stage; it has provided clean, validated data for the gate to evaluate.

### 8.1. Updated Gating Flow

```
1. Initial form submission
   ↓
2. Backend analysis (check for triggers)
   ↓
3. IF triggers detected → AI chat (1-3 questions)
   ↓
4. AI outputs structured JSON with field updates
   ↓
5. Backend updates inquiry record with clarified data
   ↓
6. Re-run deterministic gate with updated data
   ↓
7. Route based on gate_status:
   - pass → Free strategy call (Calendly link)
   - fail → Paid advisory session (Calendly + Stripe link)
   - manual → No scheduling shown; notify founder for manual review
```

### 8.2. Override Rules

The AI is permitted to override the user's original form submission under the following conditions:

| Original Field Value | AI Override Condition | Action |
| :--- | :--- | :--- |
| `access_model` is `remote_access` | User confirms in AI chat that access is actually `managed_devices` or `onpremise_only` | Update `access_model` to the confirmed value. This will likely trigger a `manual` gate status. |
| `budget_range` is `10k_25k` | User confirms in AI chat that budget is flexible and selects `25k_50k` or higher | Update `budget_range` to the confirmed value. This may change the gate status from `fail` to `pass`. |
| `service_type` is `unclear` | User selects a specific service in AI chat | Update `service_type` to the confirmed value. |

All overrides must be logged in the `clarifications` array within the AI's JSON output, including the original value, the new value, and the reason for the change.

## 9. Edge Cases and Guardrails

### 9.1. Maximum Question Limit

The AI must stop after asking **3 questions** in total, regardless of whether all ambiguities have been resolved. This is a hard limit to prevent user fatigue and form abandonment. If critical information is still missing after 3 questions, the lead should be routed to `manual` review.

### 9.2. User Abandons AI Chat

If the user closes the chat or does not respond within the session TTL (30 minutes idle), the backend should:

1.  Save the partial AI interaction data.
2.  Route the lead to `manual` review with a note: "User did not complete AI clarification."
3.  Send a follow-up email to the user with a link to resume the intake or schedule a manual review call.

### 9.3. AI Detects Unresolvable Contradiction

If the AI asks a confirmation question and the user's response still does not resolve the contradiction (e.g., they provide a vague or non-committal answer), the AI should:

1.  Log the issue in `ai_pre_call_notes` under `detected_risks`.
2.  Stop asking further questions about that field.
3.  Route the lead to `manual` review.

### 9.4. Budget/Scope Mismatch with No Flexibility

If the AI detects a budget/scope mismatch and the user confirms that the budget is fixed and the scope cannot be reduced, the AI should:

1.  Log this as a `budget_scope_mismatch` risk in `ai_pre_call_notes`.
2.  Not override the `budget_range` field.
3.  Allow the deterministic gate to route the lead (likely to `fail` → paid advisory).

## 10. Success Metrics

To evaluate the effectiveness of the AI assistant, the following metrics should be tracked:

| Metric | Description | Target |
| :--- | :--- | :--- |
| **AI Activation Rate** | Percentage of form submissions that trigger the AI | 20-30% (indicates good trigger calibration) |
| **AI Completion Rate** | Percentage of users who complete the AI chat after it is triggered | > 80% (indicates questions are valuable and not burdensome) |
| **Override Rate** | Percentage of AI interactions that result in a field override | 10-20% (indicates the AI is catching meaningful contradictions) |
| **Gate Status Change Rate** | Percentage of leads whose gate status changes after AI interaction | 15-25% (indicates the AI is providing decision-relevant data) |
| **Manual Review Reduction** | Percentage decrease in leads routed to manual review after AI implementation | 30-40% (indicates the AI is successfully clarifying ambiguities) |

## 11. Summary

This AI assistant is a **context-aware, situational intelligence layer** designed to enhance the lead intake process without adding unnecessary friction. It activates only when needed, asks smart and respectful questions, and provides the backend with clean, validated data for deterministic routing. By resolving ambiguities, detecting contradictions, and gathering pre-call intelligence, it saves the consultant time and ensures that every lead is routed appropriately based on accurate information.
