# Smart Intake + AI Routing + Payment System

## System Design Document

---

## 1. SYSTEM OVERVIEW

### What This System Does
A lead qualification and routing system that:
1. Captures inquiries via a traditional form
2. Qualifies leads based on deterministic rules
3. Uses AI only for summarization and ambiguity detection
4. Routes high-signal leads to a free strategy call, low-signal to paid advisory
5. Sends Stripe deposits after strategy call or manual approval
6. Notifies founder via Slack for all new inquiries
7. Provides a simple admin view for manual review/override

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Homepage  │───▶│ Intake Form │───▶│ Post-Submit │         │
│  │   (React)   │    │  (React)    │    │   Router    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   /intake   │───▶│Qualification│───▶│   Routing   │         │
│  │   endpoint  │    │   Engine    │    │   Logic     │         │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘         │
│                            │                   │                │
│                     ┌──────▼──────┐     ┌──────▼──────┐        │
│                     │ AI Summary  │     │   Slack     │        │
│                     │ (optional)  │     │   Webhook   │        │
│                     └─────────────┘     └─────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Supabase   │    │   Stripe    │    │  Calendly   │         │
│  │  (Postgres) │    │  (Payments) │    │ (Scheduling)│         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Where AI IS Used
- Summarizing free-text "Project Context" field (for founder convenience)
- Detecting ambiguity in responses (optional, V2)

### Where AI IS NOT Used
- Qualification decisions (deterministic rules)
- Routing decisions (deterministic rules)
- Pricing/payment amounts (hardcoded products)
- Access validation (checkbox confirmation)
- Any contractual commitments

---

## 2. USER ENTRY POINTS

| Entry Point | Source | User Context | First Question |
|------------|--------|--------------|----------------|
| "Start a Project" | Homepage CTA | Read services, interested | Service type selection |
| "Apply for a Strategy Call" | Header nav | Wants to talk first (qualified only) | Service type selection |
| Direct link | LinkedIn/Email | Variable, may be cold | Same as "Start a Project" |

**All entry points lead to the same intake form**, but the UI may pre-select based on entry context.

---

## 3. INTAKE QUESTION DESIGN

### 3.1 Core Questions (Mandatory)

| # | Question | Field Type | Why It Exists | What It Filters |
|---|----------|------------|---------------|-----------------|
| 1 | Full Name | Text | Identity | Nothing (required) |
| 2 | Work Email | Email | Contact + company signal | Personal emails (flag, not block) |
| 3 | Role / Title | Select | Seniority signal | Junior roles (lower priority) |
| 4 | What do you need help with? | Select | Intent classification | Routes to correct path |
| 5 | How do external collaborators access your codebase? | Select | **Critical access filter** | Locked-down environments |
| 6 | What's your timeline? | Select | Urgency signal | "Someday" vs immediate |
| 7 | Estimated budget range | Select | Economic fit | Below-minimum budgets |
| 8 | Project Context | Textarea | Specificity signal | Vague = lower quality |

### Question 3: Role / Title Options
```
- "Founder / C-suite"
- "VP / Director"
- "Engineering Manager"
- "IC / Engineer"
- "Other"
```

### Question 4: Service Type Options
```
- "Paid advisory / second opinion (paid session)" → Paid advisory path
- "Audit of existing AI system" → Audit path
- "Build or ship something" → Project path
- "Not sure yet" → Evaluate for strategy call eligibility
```

### Question 5: Access Model Options (CRITICAL FILTER)
```
- "Remote access to our cloud/repos (standard contractor setup)"
  → QUALIFIED ✓

- "You'd work in our environment with your own tools"
  → QUALIFIED ✓

- "We provide managed devices with pre-installed tools"
  → FLAGGED ⚠️ (manual review)

- "Strict on-premise only, no external tools allowed"
  → FLAGGED ⚠️ (manual review)

- "Not sure / need to check with IT"
  → FLAGGED ⚠️ (manual review)
```

### Question 6: Timeline Options
```
- "Urgent (this week)" → High priority
- "Soon (this month)" → Standard priority
- "Planning ahead (next quarter)" → Lower priority
- "Just exploring" → Flag for potential tire-kicker
```

### Question 7: Budget Range Options
```
- "< $10k" → Low signal
- "$10k-$25k" → Medium signal
- "$25k-$50k" → High signal
- "$50k+" → High signal
- "Not sure" → Low signal
```

### 3.2 Progressive Questions (Shown Conditionally)

| Condition | Additional Question |
|-----------|---------------------|
| service_type = audit | "What's the primary concern? (Performance / Reliability / Cost / Security)" |
| service_type = project | "Do you have an existing codebase or starting fresh?" |
| service_type = advisory_paid | "What do you want answered in this session?" |
| Timeline = "Urgent" | "What's driving the urgency?" |

### 3.3 Call Positioning & CTA Copy
- Primary CTA: "Apply for a Strategy Call" (free, qualified only)
- Subcopy: "We review every request; not all applications are accepted."
- If not eligible: Show "Paid Advisory Session" as the next step

---

## 4. ROUTING LOGIC & GATING

### 4.1 Service Type Categories

| Service Type | Criteria | Notes |
|--------------|----------|-------|
| **Paid Advisory** | service_type = advisory_paid | Paid session, always allowed |
| **Audit** | service_type = audit | Project intent |
| **Project** | service_type = project | Project intent |
| **Unclear** | service_type = unclear | Treat as project intent for gating |

### 4.2 High-Signal Gate (Strategy Call Eligibility)

**Gate Criteria (all required for pass):**
- Business email (non-personal domain)
- Access model = qualified
- Timeline = urgent or soon
- Budget range meets minimum threshold (configurable)
- Role/title indicates seniority (Founder/C-suite, VP/Director, Eng Manager)
- Context length >= 100 characters

**Gate Outcomes:**
- `pass`: all criteria met → eligible for free strategy call
- `manual`: missing critical fields → manual review
- `fail`: clearly below minimum → no free call

### 4.3 Routing Paths

| Path | Criteria | Default Action |
|------|----------|----------------|
| **Strategy Call (Free)** | service_type in {audit, project, unclear} AND gate_status = pass | Route to Calendly (free strategy call) |
| **Paid Advisory** | service_type = advisory_paid OR gate_status = fail | Route to paid advisory checkout/Calendly |
| **Manual Review** | Access flagged OR gate_status = manual | Generic thank you, manual review only |
| **Low Quality** | Context < 20 chars OR email = personal | Continue routing, add flag for lower priority |

### Fallback Behavior
- If access flagged → Always manual review only (never auto-route to payment)
- If gate_status = fail → Offer paid advisory (no free call)
- If gate_status = manual → Manual review and founder decision

---

## 5. AI USAGE DESIGN

### 5.1 Where AI SHOULD Be Used

**Use Case: Context Summarization**
- Input: Free-text "Project Context" field
- Model: Any capable LLM (GPT-4o-mini, Claude Haiku, Gemini Flash)
- Output: 2-3 sentence summary for founder's quick review
- When: Async, after form submission, stored in database

```python
# Prompt template
SUMMARY_PROMPT = """
Summarize this project inquiry in 2-3 sentences.
Focus on: what they want, what's blocking them, urgency signals.
Keep it factual, no fluff.

Input: {context}
"""
```

**Use Case: Ambiguity Detection (V2)**
- Input: All form responses
- Output: Boolean flag if responses seem contradictory
- When: Only if multiple signals conflict

### 5.2 Where AI MUST NOT Be Used

| Decision | Why Not AI |
|----------|-----------|
| Qualification (qualified/flagged) | Deterministic, must be predictable |
| Routing (Calendly/Stripe/manual) | Business logic, not probabilistic |
| Pricing | Hardcoded products, legal implications |
| Access validation | Yes/no based on selection, no interpretation |
| Any commitment language | Contractual liability |

---

## 6. DECISION TREE (DETERMINISTIC)

```
START: Form Submitted
│
├─► Is access answer flagged?
│   ├─► YES → MANUAL REVIEW ONLY (generic thank you, no payment routing)
│   └─► NO → Continue
│
├─► Is low quality? (context < 20 chars OR email = personal)
│   ├─► YES → ADD FLAG (continue routing with lower priority marker)
│   └─► NO → Continue
│
├─► Is service_type = advisory_paid?
│   ├─► YES → ROUTE TO PAID ADVISORY (Calendly + Stripe)
│   └─► NO → Continue
│
├─► Evaluate high-signal gate
│   ├─► PASS → ROUTE TO FREE STRATEGY CALL (Calendly)
│   ├─► MANUAL → MANUAL REVIEW ONLY (no auto-routing)
│   └─► FAIL → OFFER PAID ADVISORY (no free call)
│
END: Show appropriate next step to user
```

---

## 7. STRIPE & BOOKING FLOW

### Initial Offerings (V1)

| Product | Type | Price | When Shown |
|---------|------|-------|------------|
| Strategy Call (Free, application-only) | Calendly | $0 | gate_status = pass and service_type != advisory_paid |
| Paid Advisory Session | Calendly + Stripe | $400/hr (30min minimum) | service_type = advisory_paid OR gate_status = fail |
| AI Systems Audit | Stripe deposit | $2,500 deposit | After strategy call / manual approval |
| Project Discovery | Stripe deposit | $5,000 deposit | After strategy call / manual approval |

### Payment Flow

**Strategy Call Path (Free, Gated):**
1. Form submitted → Create Inquiry record
2. Gate pass → Show "Apply/Book Strategy Call" → Calendly embed with `inquiry_id` in UTM or custom field
3. Calendly schedules (no payment)
4. Webhook receives event → Extract `inquiry_id` → Create Booking record linked to Inquiry
5. After call, founder can send Stripe deposit for qualified projects

**Paid Advisory Path (Paid Session):**
1. Form submitted → service_type = advisory_paid OR gate_status = fail → Create Inquiry record
2. Show: "Paid Advisory Session" → Calendly with payment OR Stripe Checkout then scheduling
3. Webhook receives event → Extract `inquiry_id` → Create Booking + Payment records

**Project/Audit Deposit Path (Post-Call or Manual Approval):**
1. Founder triggers "Send to Stripe" from admin
2. Stripe Checkout with `inquiry_id` in metadata
3. Webhook receives event → Extract `inquiry_id` → Create/update Payment record

### Webhook Handling
- Stripe: Pass `inquiry_id` in Checkout Session metadata; webhook resolves via `session.metadata.inquiry_id`
- Calendly: Pass `inquiry_id` in scheduling link UTM params or invitee questions; webhook resolves via event payload
- Paid advisory stores provider-specific IDs and payment references (not always Stripe session IDs)

### Post-Payment
- Database updated with payment/booking status
- Slack notification with inquiry summary + payment confirmed
- User sees confirmation page with next steps
- Founder follows up via email

---

## 8. DATA MODEL (CONCEPTUAL)

### Relationships
- Inquiry has 1:N Payments
- Inquiry has 1:N Bookings

### Entity: Inquiry

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| created_at | Timestamp | Yes | Auto |
| updated_at | Timestamp | Yes | Auto-updated on change |
| name | String | Yes | |
| email | String | Yes | Validated |
| email_domain | String | Yes | Extracted for filtering |
| role_title | Enum | Yes | Seniority signal |
| budget_range | Enum | Yes | Below-minimum budgets |
| gate_status | Enum | Yes | pass/manual/fail |
| gate_details | JSONB | Yes | Snapshot of criteria evaluated and results |
| service_type | Enum | Yes | advisory_paid/audit/project/unclear |
| access_model | Enum | Yes | qualified/flagged variants |
| timeline | Enum | Yes | urgent/soon/planning/exploring |
| context_raw | Text | Yes | Original user input |
| context_summary | Text | No | AI-generated, async |
| status | Enum | Yes | new/reviewed/converted/rejected |
| qualification | Enum | Yes | qualified/flagged/low_quality |
| routing_result | Enum | No | calendly_strategy_free/paid_advisory/stripe_audit/stripe_project/manual |
| flags | JSON | No | Array of flag reasons |
| notes | Text | No | Founder's manual notes |
| entry_point | String | No | e.g., "homepage_cta", "header_nav", "direct_link" |
| utm_source | String | No | |
| utm_medium | String | No | |
| utm_campaign | String | No | |
| utm_term | String | No | |
| utm_content | String | No | |
| referrer | String | No | HTTP referrer |
| ip_address | String | No | For rate limiting |
| user_agent | String | No | |
| form_version | String | Yes | e.g., "1.0.0" |
| rules_version | String | Yes | e.g., "1.0.0" |
| answers_raw | JSONB | Yes | Full form payload |
| answers_version | String | Yes | Schema version of answers |

### Entity: Payment

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| inquiry_id | UUID | Yes | Foreign key |
| created_at | Timestamp | Yes | |
| updated_at | Timestamp | Yes | Auto-updated on change |
| provider | Enum | Yes | stripe/calendly_stripe/other |
| provider_event_id | String | No | Unique per provider |
| stripe_session_id | String | No | Unique, nullable if not Stripe direct |
| stripe_payment_intent | String | No | Unique, after completion |
| product_type | Enum | Yes | advisory_paid/audit_deposit/project_deposit |
| amount_cents | Integer | Yes | |
| currency | String | Yes | e.g., "usd" |
| status | Enum | Yes | pending/completed/failed/refunded |
| amount_refunded_cents | Integer | No | |
| refunded_at | Timestamp | No | |
| failure_reason | String | No | |
| metadata | JSONB | No | Provider-specific data |
| completed_at | Timestamp | No | |

### Entity: Booking

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| inquiry_id | UUID | Yes | Foreign key |
| created_at | Timestamp | Yes | |
| updated_at | Timestamp | Yes | Auto-updated on change |
| provider | Enum | Yes | calendly/other |
| provider_event_id | String | Yes | Unique per provider |
| booking_type | Enum | Yes | strategy_call_free/advisory_paid |
| scheduled_at | Timestamp | Yes | |
| duration_minutes | Integer | Yes | |
| timezone | String | Yes | e.g., "America/Los_Angeles" |
| status | Enum | Yes | scheduled/completed/cancelled/rescheduled |
| canceled_at | Timestamp | No | |
| rescheduled_from_id | UUID | No | FK to previous Booking |
| metadata | JSONB | No | Provider-specific data |

### Entity: InquiryEvent (Status/History)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| inquiry_id | UUID | Yes | Foreign key |
| actor_type | Enum | Yes | system/founder/webhook |
| actor_id | String | No | User ID or "system" |
| event_type | String | Yes | e.g., "status_change", "note_added", "override" |
| old_value | String | No | Previous value |
| new_value | String | No | New value |
| reason | String | No | Why the change was made |
| created_at | Timestamp | Yes | |

### Entity: WebhookEvent

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| provider | Enum | Yes | stripe/calendly |
| event_id | String | Yes | Provider's event ID |
| inquiry_id | UUID | No | Resolved from metadata |
| payload | JSONB | Yes | Raw webhook payload |
| received_at | Timestamp | Yes | |
| processed_at | Timestamp | No | |
| status | Enum | Yes | pending/processed/failed |

### Indexes and Constraints
- `inquiries`: Index on (email), (created_at), (status), (gate_status), (qualification)
- `payments`: Index on (inquiry_id), (status), (created_at)
- `bookings`: Index on (inquiry_id), (status), (scheduled_at)
- `payments`: Unique on (provider, provider_event_id) where not null
- `payments`: Unique on (stripe_session_id) where not null
- `payments`: Unique on (stripe_payment_intent) where not null
- `bookings`: Unique on (provider, provider_event_id)
- `webhook_events`: Unique on (provider, event_id)

### Status Models

**inquiry_status transitions:**
```
new → reviewed → converted
new → reviewed → rejected
```
"converted" = has at least one:
- completed Payment (advisory_paid, audit_deposit, or project_deposit), OR
- completed Booking with booking_type = advisory_paid

Note: Deposits (audit/project) are sent post-call or via manual approval, so conversion typically follows the `new → reviewed → converted` path.

**payment_status transitions:**
```
pending → completed
pending → failed
completed → refunded
```

**booking_status transitions:**
```
scheduled → completed
scheduled → cancelled
scheduled → rescheduled
```

### What Must Be Stored
- All form submissions (audit trail)
- Payment records (financial compliance)
- Status transitions via InquiryEvent (debugging, analytics)

### What Should Be Ephemeral
- AI processing intermediate states
- Retry attempts

### What Must Be Auditable
- All payment transactions
- Status changes with timestamps (via InquiryEvent)
- Manual overrides by founder (via InquiryEvent)

---

## 8.1 VERSIONING

- `form_version`: Tracks which version of the intake form was used. Increment when adding/removing/changing questions.
- `rules_version`: Tracks which version of qualification/routing rules were applied. Increment when changing logic.
- `answers_version`: Tracks the schema of `answers_raw` JSONB. Increment when field names or structure change.

This enables debugging historical inquiries and A/B testing different form/rule versions.

---

## 8.2 SQL SCHEMA

**Migration file:** `backend/supabase/migrations/001_initial_schema.sql`

**Tables created:**
- `inquiries` - Form submissions with all fields
- `payments` - Stripe/payment records
- `bookings` - Calendly/scheduling records
- `inquiry_events` - Audit log
- `webhook_events` - Raw webhook storage

**Key design decisions:**
- All enums defined as Postgres ENUM types for type safety
- `provider_event_id` uniqueness is per-provider (composite unique index)
- Additional payment deduplication: unique indexes on `stripe_session_id` and `stripe_payment_intent`
- RLS enabled: service_role has full access, **no anon access** (all writes via backend)
- Auto-updating `updated_at` triggers on core tables
- `gate_details` JSONB stores snapshot of criteria for auditability

---

## 9. ADMIN / FOUNDER VIEW

### V1 Admin Features (Simple List View)

**Dashboard URL:** `/admin/inquiries`

**List View Columns:**
| Column | Data |
|--------|------|
| Date | created_at |
| Name | name |
| Email | email + domain badge |
| Type | service_type icon |
| Status | qualification badge (green/yellow/red) |
| Gate | gate_status (pass/manual/fail) |
| Payment | Latest payment_status (if any) |
| Booking | Latest booking_status (if any) |
| Summary | context_summary (truncated) |
| Actions | View, Mark Reviewed, Add Note |

**Color Coding:**
- 🟢 Green: Qualified, paid or booked
- 🟡 Yellow: Flagged, needs review
- 🔴 Red: Low quality or rejected

**Filters:**
- Status: All / New / Reviewed / Converted
- Qualification: All / Qualified / Flagged
- Gate: All / Pass / Manual / Fail
- Service Type: All / Paid Advisory / Audit / Project / Unclear

**Detail View:**
- All form fields
- AI summary
- Raw context
- Flags list (all flag reasons)
- Gate decision and criteria snapshot
- Payment/booking status with history
- Event/History panel (InquiryEvent rows in chronological order)
- Founder notes field
- Manual override notes
- Manual action buttons: "Send to Calendly", "Send to Stripe", "Reject"

### Slack Integration

**New Inquiry Alert:**
```
🔔 New Inquiry from [Name]
Company: [extracted from email domain]
Type: [service_type]
Timeline: [timeline]
Access: [qualified ✓ / flagged ⚠️]
Gate: [pass / manual / fail]

Summary: [AI summary]

[View in Admin →]
```

---

## 10. FAILURE MODES & SAFETY

| Scenario | System Behavior | User Message |
|----------|-----------------|--------------|
| Unclear/contradictory answers | Route to manual review | "Thanks! I'll review and follow up via email." |
| Low-quality lead (vague context) | Continue normal routing, add flag for lower priority | Normal routing message (Calendly/Stripe based on intent) |
| Low-signal request for free call | Do not show free scheduling; offer paid advisory or manual review | "We can help via a paid advisory session or follow up by email." |
| Malicious input (XSS, SQL injection) | Sanitize, log attempt | Normal thank you (don't reveal detection) |
| Over-eager buyer (wants to pay immediately) | Still require form first | Guide through normal flow |
| AI summary fails | Store null, founder sees raw text | No user-facing impact |
| Stripe checkout fails | Log error, show fallback | "Issue processing. Email us directly at..." |
| Calendly unavailable | Show email fallback | "Scheduling unavailable. Email to book..." |

### Rate Limiting
- Max 3 submissions per email per day
- Max 10 submissions per IP per hour

---

## 11. ITERATIVE REFINEMENT PLAN

### Metrics That Matter (V1)

| Metric | What It Tells Us |
|--------|------------------|
| Submission → Payment conversion | Is qualification working? |
| Gate pass rate | Are we letting too many/few into free strategy calls? |
| Strategy call → Paid conversion | Is the free call producing project demand? |
| Paid advisory conversion | Is the paid advisory path capturing low-signal demand? |
| Flagged → Manual conversion | Are we over-filtering? |
| Time to first response | Is the system fast enough? |
| Drop-off at form | Is form too long? |

### Signals of Friction
- High flagged rate (>30%) → Access question too aggressive
- Low gate pass rate (<10%) → Gate too strict or pricing mismatch
- High gate pass rate (>50%) → Gate too loose, free call overloaded
- Low payment conversion → Routing/pricing mismatch
- Founder overriding often → Rules don't match reality

### What to Change First
1. Access question wording (if too many false flags)
2. Service type options (if unclear to users)
3. Gate thresholds (budget/timeline/role) based on pass rate
4. Pricing/deposit amounts (based on conversion)

### Avoiding Overfitting
- Don't change rules until 50+ submissions
- A/B test question wording before full rollout
- Keep founder override data to identify patterns

---

## 12. V1 VS V2 BOUNDARY

### V1 (Ship in ~1 Week)

**Required:**
- [ ] Intake form with 8 questions (includes role + budget gating)
- [ ] Deterministic qualification logic
- [ ] Database storage (Supabase)
- [ ] Stripe Checkout for deposits
- [ ] Calendly embed for strategy call + paid advisory
- [ ] Slack webhook notifications
- [ ] Simple admin list view
- [ ] Basic AI summarization (async)

**Hard Limits:**
- No custom scheduling (use Calendly)
- No complex dashboards (use Supabase dashboard + simple list)
- No email automation (manual follow-up)
- No multi-step intake wizard

### V2 (Only If Pull Exists)

**Automation:**
- Auto-email sequences based on status
- Calendar sync for availability

**AI Sophistication:**
- Intent disambiguation prompts
- Conversation-style intake

**Dashboards:**
- Analytics charts
- Funnel visualization
- Revenue tracking

**Productization:**
- Self-serve project scoping
- Automated proposals

---

## 13. FINAL SANITY CHECK

| Question | Answer |
|----------|--------|
| Is this buildable in ~1 week? | ✓ Yes - 8 fields, 4 products, simple routing |
| Does it directly help generate income? | ✓ Yes - routes paid advisory immediately and gates strategy calls |
| Does it reduce cognitive load? | ✓ Yes - AI summary, Slack alerts, qualification |
| Does it preserve optionality? | ✓ Yes - manual override, simple rules to adjust |

### If Any Were "No", Simplification Would Be:
- Remove progressive questions (V2)
- Remove AI summarization (just show raw text)
- Remove admin UI (just use Supabase dashboard)

---

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Set up Supabase project
- [ ] Create `inquiries` table with indexes
- [ ] Create `payments` table with indexes
- [ ] Create `bookings` table with indexes
- [ ] Create `inquiry_events` table
- [ ] Create `webhook_events` table
- [ ] Set up Row Level Security

### Phase 2: Backend Core (Day 2-3)
- [ ] FastAPI project setup
- [ ] POST /intake endpoint
- [ ] Qualification logic service
- [ ] High-signal gate evaluation
- [ ] Supabase client integration
- [ ] Slack webhook integration

### Phase 3: Payments (Day 4)
- [ ] Stripe products/prices setup (paid advisory + deposits)
- [ ] POST /checkout endpoint
- [ ] Stripe webhook handler
- [ ] Payment status updates

### Phase 4: Frontend Integration (Day 5)
- [ ] Replace current form with smart intake
- [ ] Post-submit routing component
- [ ] Gated strategy call CTA + Calendly embed
- [ ] Paid advisory CTA + Stripe Checkout redirect
- [ ] Stripe Checkout redirect for deposits (post-approval)

### Phase 5: Admin & Polish (Day 6-7)
- [ ] Simple admin list page
- [ ] AI summarization (async)
- [ ] Error handling
- [ ] Testing

---

*This design is intentionally boring. If implementation feels exciting, something is overbuilt.*
