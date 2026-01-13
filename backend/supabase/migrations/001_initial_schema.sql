-- Migration: 001_initial_schema
-- Description: Initial schema for Smart Intake System
-- Created: 2026-01-07

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE service_type AS ENUM ('advisory_paid', 'audit', 'project', 'unclear');
CREATE TYPE access_model AS ENUM (
  'remote_access',
  'own_environment_own_tools',
  'managed_devices',
  'onpremise_only',
  'unsure'
);
CREATE TYPE timeline AS ENUM ('urgent', 'soon', 'planning', 'exploring');
CREATE TYPE budget_range AS ENUM ('under_10k', '10k_25k', '25k_50k', 'over_50k', 'unsure');
CREATE TYPE role_title AS ENUM ('founder_csuite', 'vp_director', 'eng_manager', 'business_ops_manager', 'ic_engineer', 'other');
CREATE TYPE gate_status AS ENUM ('pass', 'manual', 'fail');
CREATE TYPE inquiry_status AS ENUM ('new', 'reviewed', 'converted', 'rejected');
CREATE TYPE qualification AS ENUM ('qualified', 'flagged', 'low_quality');
CREATE TYPE routing_result AS ENUM (
  'calendly_strategy_free',
  'paid_advisory',
  'stripe_audit',
  'stripe_project',
  'manual'
);

CREATE TYPE payment_provider AS ENUM ('stripe', 'calendly_stripe', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE product_type AS ENUM ('advisory_paid', 'audit_deposit', 'project_deposit');

CREATE TYPE booking_provider AS ENUM ('calendly', 'other');
CREATE TYPE booking_type AS ENUM ('strategy_call_free', 'advisory_paid');
CREATE TYPE booking_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

CREATE TYPE actor_type AS ENUM ('system', 'founder', 'webhook');
CREATE TYPE webhook_status AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE webhook_provider AS ENUM ('stripe', 'calendly');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Inquiries: Core form submissions
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_domain TEXT NOT NULL,

  -- Form answers
  role_title role_title NOT NULL,
  service_type service_type NOT NULL,
  access_model access_model NOT NULL,
  timeline timeline NOT NULL,
  budget_range budget_range NOT NULL,
  context_raw TEXT NOT NULL,
  context_summary TEXT,

  -- Qualification & Routing
  gate_status gate_status NOT NULL,
  gate_details JSONB NOT NULL, -- Snapshot of criteria evaluated and results
  status inquiry_status NOT NULL DEFAULT 'new',
  qualification qualification NOT NULL,
  routing_result routing_result,
  flags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  -- Tracking
  entry_point TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Versioning
  form_version TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  answers_raw JSONB NOT NULL,
  answers_version TEXT NOT NULL
);

-- Payments: Stripe and other payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Provider info
  provider payment_provider NOT NULL,
  provider_event_id TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,

  -- Payment details
  product_type product_type NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status payment_status NOT NULL DEFAULT 'pending',

  -- Refund tracking
  amount_refunded_cents INTEGER,
  refunded_at TIMESTAMPTZ,

  -- Error handling
  failure_reason TEXT,

  -- Provider-specific data
  metadata JSONB,

  -- Completion
  completed_at TIMESTAMPTZ
);

-- Bookings: Calendly and other scheduling records
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Provider info
  provider booking_provider NOT NULL,
  provider_event_id TEXT NOT NULL,

  -- Booking details
  booking_type booking_type NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  status booking_status NOT NULL DEFAULT 'scheduled',

  -- Cancellation/Reschedule
  canceled_at TIMESTAMPTZ,
  rescheduled_from_id UUID REFERENCES bookings(id),

  -- Provider-specific data
  metadata JSONB
);

-- InquiryEvents: Audit log for status changes
CREATE TABLE inquiry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Actor
  actor_type actor_type NOT NULL,
  actor_id TEXT,

  -- Event details
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT
);

-- WebhookEvents: Raw webhook storage for debugging
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,

  -- Provider info
  provider webhook_provider NOT NULL,
  event_id TEXT NOT NULL,

  -- Linking
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,

  -- Payload
  payload JSONB NOT NULL,
  status webhook_status NOT NULL DEFAULT 'pending'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Inquiries indexes
CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_gate_status ON inquiries(gate_status);
CREATE INDEX idx_inquiries_qualification ON inquiries(qualification);

-- Payments indexes
CREATE INDEX idx_payments_inquiry_id ON payments(inquiry_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Bookings indexes
CREATE INDEX idx_bookings_inquiry_id ON bookings(inquiry_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);

-- InquiryEvents indexes
CREATE INDEX idx_inquiry_events_inquiry_id ON inquiry_events(inquiry_id);
CREATE INDEX idx_inquiry_events_created_at ON inquiry_events(created_at DESC);

-- WebhookEvents indexes
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at DESC);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Prevent duplicate provider events
CREATE UNIQUE INDEX idx_payments_provider_event
  ON payments(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- Additional payment deduplication: prevent duplicate Stripe sessions/intents
CREATE UNIQUE INDEX idx_payments_stripe_session
  ON payments(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX idx_payments_stripe_intent
  ON payments(stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;

CREATE UNIQUE INDEX idx_bookings_provider_event
  ON bookings(provider, provider_event_id);

CREATE UNIQUE INDEX idx_webhook_events_provider_event
  ON webhook_events(provider, event_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role (backend) can do everything
CREATE POLICY "Service role full access on inquiries"
  ON inquiries FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on bookings"
  ON bookings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on inquiry_events"
  ON inquiry_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on webhook_events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- NOTE: No anon access. All writes go through backend (service_role).
-- Frontend calls POST /api/intake which validates, computes gate_status/qualification,
-- then inserts via service_role. This prevents clients from setting computed fields.

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE inquiries IS 'Form submissions from intake system';
COMMENT ON TABLE payments IS 'Payment records from Stripe/Calendly';
COMMENT ON TABLE bookings IS 'Booking records from Calendly';
COMMENT ON TABLE inquiry_events IS 'Audit log for inquiry status changes';
COMMENT ON TABLE webhook_events IS 'Raw webhook payloads for debugging';

COMMENT ON COLUMN inquiries.gate_status IS 'High-signal gate result: pass/manual/fail';
COMMENT ON COLUMN inquiries.gate_details IS 'Snapshot of gate criteria evaluated: {criteria: {...}, results: {...}, passed: [...], failed: [...]}';
COMMENT ON COLUMN inquiries.answers_raw IS 'Full form payload as submitted';
COMMENT ON COLUMN inquiries.form_version IS 'Version of intake form used';
COMMENT ON COLUMN inquiries.rules_version IS 'Version of qualification rules applied';

COMMENT ON COLUMN payments.provider_event_id IS 'Unique event ID from provider (Stripe/Calendly)';
COMMENT ON COLUMN bookings.booking_type IS 'Free strategy call vs paid advisory';
