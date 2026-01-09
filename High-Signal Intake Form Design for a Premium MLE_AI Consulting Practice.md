# High-Signal Intake Form Design for a Premium MLE/AI Consulting Practice

This document outlines the design of a scientifically-grounded, high-signal intake form for a premium MLE/AI consulting practice. The design is optimized for lead qualification without overwhelming users, ensuring a premium and respectful user experience.

## 1. Form Architecture

To meet the dual goals of capturing high-quality data and minimizing user friction, a **multi-step wizard format** is recommended over a single-page form. This approach is grounded in established UX principles and has been shown to significantly improve conversion rates.

### 1.1. Rationale for Multi-Step Wizard

The multi-step format leverages several key psychological and behavioral principles:

*   **Progressive Disclosure**: By breaking the form into smaller, logical sections, we avoid overwhelming the user with a long list of questions at once. This technique reduces cognitive load, making the form feel less intimidating and easier to complete [1]. Multi-step forms can improve completion rates when steps are short and progress is visible [2].
*   **Cognitive Load Theory**: A long form with many fields increases the mental effort required from the user, leading to higher abandonment rates. A multi-step form presents only a few questions at a time (ideally 5-9 fields per step), which aligns with human working memory limitations and makes the task feel more manageable [3].
*   **Fogg Behavior Model (B=MAP)**: This model posits that for a behavior (like completing a form) to occur, Motivation, Ability, and a Prompt must converge. The multi-step approach enhances **Ability** by making the form easier to complete. Starting with simple questions also builds momentum and commitment, increasing **Motivation** to finish the process [4].
*   **Sunk Cost Fallacy**: Once a user has invested time and effort in completing the initial steps, they are psychologically more likely to complete the entire form.

### 1.2. Proposed Form Structure

The form will be structured as a three-step wizard with a clear progress indicator. The estimated completion time is **under 3 minutes**.

| Step | Title             | Description                                                                 | Estimated Time |
| :--- | :---------------- | :-------------------------------------------------------------------------- |
| 1    | Basic Information | Capture essential contact and company details. Low-friction entry point.    | 30 seconds     |
| 2    | Project Details   | Understand the user's needs and the scope of the potential engagement.      | 60-90 seconds  |
| 3    | Qualification     | Gather specific data points for lead scoring and gating (budget, timeline). | 30 seconds     |

### 1.3. Question Order and Flow

The question order is designed to build trust and momentum, starting with easy, non-threatening questions and progressing to more specific, qualifying ones.

1.  **Step 1: Basic Information**
    *   Full Name
    *   Work Email (with business domain validation)
    *   Company Name (optional)
    *   Your Role

2.  **Step 2: Project Details**
    *   Service type (paid advisory, audit, build, not sure)
    *   Project Context (free text, with minimum character count)
    *   *Conditional Follow-up Questions* based on service selected.

3.  **Step 3: Qualification**
    *   Project Timeline
    *   Budget Range
    *   Access Model

This structure ensures that by the time the user reaches the more sensitive qualifying questions (like budget), they have already invested in the process and are more likely to complete the form.

---

### References

[1] Interaction Design Foundation. "Progressive Disclosure." [https://www.interaction-design.org/literature/topics/progressive-disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure)

[2] Reform. "How to Create Multi-Step Forms That Convert: A Guide." [https://www.reform.app/blog/how-to-create-multi-step-forms-that-convert-a-guide](https://www.reform.app/blog/how-to-create-multi-step-forms-that-convert-a-guide)

[3] Tallwave. "Cognitive Load Theory in UX Design." [https://tallwave.com/blog/cognitive-load-in-ux/](https://tallwave.com/blog/cognitive-load-in-ux/)

[4] Fogg, BJ. "Fogg Behavior Model." [https://www.behaviormodel.org/](https://www.behaviormodel.org/)


## 2. Final Question Set

This section details each question in the proposed multi-step intake form. Each question is designed to capture a specific signal while maintaining a premium, respectful user experience.

### Step 1: Basic Information

| Question Text | Input Type | Answer Choices | Required | Mapped Schema Field | Rationale | 
| :--- | :--- | :--- | :--- | :--- | :--- |
| What is your full name? | Text | N/A | Yes | `name` | **Recognition over Recall**: A standard, low-friction starting point. | 
| What is your work email? | Email | N/A | Yes | `email`, `email_domain` | **Gate Criterion**: Validates a business email address (non-personal domain), a key signal of a serious inquiry. | 
| What is your company name? (optional) | Text | N/A | No | `answers_raw.company_name` | **Context Building**: Helpful for pre-call research; optional to reduce friction. | 
| What is your current role? | Select | Founder / C-Suite<br>VP / Director<br>Engineering Manager<br>IC Engineer<br>Other | Yes | `role_title` | **Gate Criterion**: A primary signal for decision-making authority. Senior roles are prioritized for free strategy calls. | 

### Step 2: Project Details

| Question Text | Input Type | Answer Choices | Required | Mapped Schema Field | Rationale | 
| :--- | :--- | :--- | :--- | :--- | :--- |
| What do you need help with? | Select | Paid advisory / second opinion (paid session)<br>Audit of existing AI system<br>Build or ship something<br>Not sure yet | Yes | `service_type` | **Branching & Routing**: Direct mapping to schema enums and routing (paid advisory vs. project intent). | 
| Tell me about your project. What are you trying to achieve, and what's blocking you? | Text Area | N/A (Min. 100 characters) | Yes | `context_raw` | **Gate Criterion & Signal Quality**: A minimum character count encourages thoughtful responses, filtering out low-effort inquiries. The content provides critical context for the initial consultation. | 

### Step 3: Qualification

| Question Text | Input Type | Answer Choices | Required | Mapped Schema Field | Rationale | 
| :--- | :--- | :--- | :--- | :--- | :--- |
| How soon do you need to see progress on this? | Select | **Urgent**: Within the next 2 weeks<br>**Soon**: Within the next month<br>**Planning**: 1-3 months<br>**Exploring**: 3+ months | Yes | `timeline` | **Gate Criterion**: Filters for leads with immediate needs, indicating higher motivation and a greater likelihood of converting. | 
| What is your estimated budget for this project? | Select | < $10,000<br>$10,000 - $25,000<br>$25,000 - $50,000<br>$50k+<br>Not sure | Yes | `budget_range` | **Gate Criterion**: The most direct signal of financial qualification. The "Not sure" option avoids drop-off from users who are early in procurement. | 
| To be effective, I require direct access to your code and systems. How would we work together? | Select | **Remote Access**: Remote access to our cloud/repos (standard contractor setup).<br>**Your Environment**: You'd work in our environment with your own tools.<br>**Managed Devices**: We provide managed devices with pre-installed tools.<br>**On-Premise Only**: Strict on-premise only, no external tools allowed.<br>**Not sure / need to check with IT** | Yes | `access_model` | **Gate Criterion & Feasibility**: Filters out clients whose security or infrastructure constraints are incompatible with the consultant's stated working model. | 


## 3. Branching Logic

Conditional logic will be used to create a more personalized and relevant experience, primarily based on the user's answer to the "What do you need help with?" question. This aligns with the principle of **progressive disclosure**, ensuring users are only asked questions relevant to their selected service.

### 3.1. Conditional Follow-up Questions

Based on the `service_type` selection, the following optional follow-up questions will be displayed within Step 2 to gather more specific context. These are optional to reduce friction but provide valuable detail if answered.

**If `service_type` is "Audit of existing AI system":**

*   **Follow-up Question:** "Briefly, what are the top 1-2 symptoms you're seeing? (e.g., high latency, unexpected costs, inaccurate results)"
*   **Input Type:** Text Area
*   **Rationale:** This question helps to immediately frame the problem and provides a starting point for the audit, demonstrating expertise by asking a diagnostically relevant question.

**If `service_type` is "Build or ship something":**

*   **Follow-up Question:** "Which best describes your project?"
*   **Input Type:** Select
*   **Answer Choices:** Prototype-to-Production<br>RAG Reliability Sprint<br>Other build/ship
*   **Mapped Field:** `answers_raw.project_subtype`
*   **Rationale:** Captures sub-type without expanding the primary service enum, keeping routing deterministic.

**If `project_subtype` is "Prototype-to-Production":**

*   **Follow-up Question:** "What is the current state of your prototype? (e.g., Jupyter notebook, containerized model, deployed in staging)"
*   **Input Type:** Text Area
*   **Mapped Field:** `answers_raw.project_state`
*   **Rationale:** Assesses technical maturity, which affects scope and feasibility.

**If `project_subtype` is "RAG Reliability Sprint":**

*   **Follow-up Question:** "What are the main issues with your RAG pipeline's performance? (e.g., hallucinations, poor document retrieval, slow generation)"
*   **Input Type:** Text Area
*   **Mapped Field:** `answers_raw.rag_issues`
*   **Rationale:** Hones in on RAG pain points for a targeted initial discussion.

**If `service_type` is "Paid advisory / second opinion (paid session)":**

*   **Follow-up Question:** "What do you want answered in this session?"
*   **Input Type:** Text Area
*   **Mapped Field:** `answers_raw.advisory_questions`
*   **Rationale:** Ensures the paid session is scoped and high-value.

**If `service_type` is "Not sure yet":**

*   **Follow-up Question:** "What outcome are you hoping to achieve?"
*   **Input Type:** Text Area
*   **Mapped Field:** `answers_raw.desired_outcome`
*   **Rationale:** Provides direction without forcing a premature service selection.

## 4. Gating Logic Details

The gating logic automatically qualifies leads based on their answers, routing them to the appropriate outcome: a free strategy call, a paid advisory session, or manual review.

*   **Routing Note:** If `service_type` is `advisory_paid`, route directly to the paid advisory session regardless of gate status.

### 4.1. Gate Pass Criteria

A lead must meet **all** of the following criteria to pass the gate for a free strategy call:

*   **Business Email**: `email_domain` is not from a public provider (e.g., gmail.com, outlook.com, yahoo.com).
*   **Qualified Access Model**: `access_model` is either `remote_access` or `own_environment_own_tools`.
*   **Urgent Timeline**: `timeline` is `urgent` or `soon`.
*   **Sufficient Budget**: `budget_range` meets the minimum threshold (see recommendation below).
*   **Senior Role**: `role_title` is `founder_csuite`, `vp_director`, or `eng_manager`.
*   **Sufficient Context**: `context_raw` has a length of 100 characters or more.

### 4.2. Recommended Default Budget Threshold

It is recommended to set the default minimum `budget_range` to **$25,000 - $50,000**. 

**Justification:**

*   **Premium Positioning**: A higher budget floor reinforces the premium nature of the consulting services and filters for clients who value high-end expertise.
*   **Project Viability**: For the described services (audits, productionization), a budget below $25,000 is unlikely to be sufficient for a meaningful engagement, making it a realistic floor.
*   **Signal Quality**: This threshold acts as a strong filter for serious clients with approved or allocated funds.

### 4.3. Gate Details JSON Schema

The `gate_details` JSONB field in the database will store a snapshot of the qualification check for transparency and future analysis. Here is a sample schema:

```json
{
  "criteria": {
    "business_email_required": true,
    "qualified_access_model_required": true,
    "urgent_timeline_required": true,
    "min_budget_range": "25k_50k",
    "senior_role_required": true,
    "min_context_length": 100
  },
  "results": {
    "is_business_email": true,
    "is_qualified_access_model": true,
    "is_urgent_timeline": false,
    "is_sufficient_budget": true,
    "is_senior_role": true,
    "is_sufficient_context": true
  },
  "pass_status": "fail",
  "fail_reasons": ["timeline_not_urgent"]
}
```


## 5. UX Copy for Outcomes

The messaging displayed to the user after form submission is critical for maintaining a premium brand experience, regardless of the outcome. The copy should be respectful, clear, and aligned with the brand's voice.

### 5.1. Accepted to Free Strategy Call

This outcome is for leads who pass the automated gating criteria.

*   **Headline:** `Thank You for Your Application`
*   **Body:** `Your project looks like a strong potential fit. The next step is a complimentary 30-minute strategy call to discuss your goals in more detail and determine the best path forward. Please use the link below to schedule a time that works for you.`
*   **Call to Action:** `[ Schedule Your Free Strategy Call ]` (links to Calendly)

### 5.2. Offered Paid Advisory Session

This outcome is for leads who do not meet the criteria for a free call but are still a potential fit for a paid engagement.

*   **Headline:** `Thank You for Your Inquiry`
*   **Body:** `Based on your project details, a dedicated advisory session would be the most effective next step. This paid 1-hour session is designed to provide you with actionable recommendations and a clear path forward. If you'd like to proceed, you can book your session here:`
*   **Call to Action:** `[ Book Your Paid Advisory Session ]` (links to Calendly + Stripe)

### 5.3. Manual Review Pending

This outcome is for leads who trigger a manual review flag (e.g., due to their `access_model` selection).

*   **Headline:** `Thank You for Your Inquiry`
*   **Body:** `Thank you for providing your project details. Your submission requires a manual review to ensure we're the right fit for your needs. Our team will get back to you within 24-48 hours with the next steps.`
*   **Call to Action:** (None)

### 5.4. Not a Fit (Polite Rejection)

This outcome is for leads who are clearly not a fit for the consulting practice and should only be used after manual review.

*   **Headline:** `Thank You for Your Inquiry`
*   **Body:** `Thank you for considering us for your project. After careful review, it appears that your current needs may not align with our core service offerings. We wish you the best of luck with your project and hope you find the right partner to help you achieve your goals.`
*   **Call to Action:** (None)

## 6. Risk/Ethics and Bias Check

It is important to identify and mitigate potential biases in the intake form design.

*   **Bias in `role_title`:** The `role_title` question inherently prioritizes senior roles, which could be perceived as biased against individuals with non-traditional titles who may still be key decision-makers. 
    *   **Mitigation:** This is a deliberate business decision to filter for authority, a standard BANT/MEDDIC principle. The inclusion of an "Other" option and the manual review process provide a safety net to catch valuable leads who do not fit neatly into the predefined categories.

*   **Bias in `budget_range`:** Asking about budget can be a sensitive topic and may deter qualified leads who are early in their procurement process. 
    *   **Mitigation:** The question is placed at the very end of the form to minimize drop-off. The inclusion of an "Unsure" option provides an out for users who are not yet ready to commit to a number. The framing of the question is neutral, focusing on project fit rather than ability to pay.

## 7. Metrics & A/B Test Ideas

To continuously optimize the intake form, the following metrics should be tracked and A/B tests considered.

### 7.1. Key Metrics to Track

1.  **Form Completion Rate:** (Total Submissions / Total Starts) - The primary indicator of form usability and friction.
2.  **Gate Pass Rate:** (Leads Passed / Total Submissions) - Measures the effectiveness and stringency of the qualification criteria.
3.  **Conversion Rate (from Free Call):** (Projects Started / Free Calls Completed) - The ultimate measure of lead quality.
4.  **Drop-off Rate per Step:** Identifies which part of the form is causing the most friction.

### 7.2. A/B Testing Ideas

1.  **Budget Question Phrasing:** Test the current direct question against a softer alternative, such as "To help us scope this project appropriately, could you provide a general sense of the investment you're considering?" This could reduce friction and improve response accuracy.

2.  **Call-to-Action (CTA) Language:** Test the initial CTA to start the form. For example, compare "Start a Project Inquiry" vs. "Apply for a Free Strategy Call." The latter may increase motivation but could also deter users who know they won't qualify.

3.  **Progress Bar Design:** Test different styles of progress indicators (e.g., percentage-based vs. step-based) to see which is more effective at encouraging completion.
