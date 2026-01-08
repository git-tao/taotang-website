---
name: webhook-safety
description: "Knowledge for safe webhook handling. Apply when working on webhook handlers, payment processing, or subscription events."
---

# Webhook Safety Skill

Safe webhook handling patterns for Stripe and other payment/event webhooks.

## When to Apply

- Modifying webhook handlers
- Processing Stripe events
- Credit allocation from payments
- Subscription status updates
- Any async event processing

## Core Invariants

### 1. Idempotency (CRITICAL)

Webhooks may be delivered multiple times. Every handler MUST be idempotent.

```javascript
// CORRECT: Idempotent handling
async function handleCheckoutCompleted(event) {
    // Check if already processed
    const existing = await db.billingEvents.findFirst({
        where: { stripeEventId: event.id }
    });

    if (existing) {
        return { status: 'already_processed' };
    }

    // Process and record
    await processCheckout(event.data.object);
    await db.billingEvents.create({
        data: { stripeEventId: event.id, eventType: event.type }
    });
}

// WRONG: Will double-credit on retry
async function handleCheckoutCompleted(event) {
    user.credits += 100; // DOUBLES ON RETRY!
}
```

### 2. Signature Verification

```javascript
app.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send('Invalid signature');
    }

    // Process event...
});
```

### 3. Fail-Fast for Critical Events

```javascript
// CORRECT: Re-throw to trigger retry
async function handlePaymentSucceeded(event) {
    try {
        await allocateCredits(event);
    } catch (error) {
        console.error('Credit allocation failed:', error);
        throw error; // Re-throw for retry
    }
}

// WRONG: Silent failure = lost payment
async function handlePaymentSucceeded(event) {
    try {
        await allocateCredits(event);
    } catch {
        // Silent catch = LOST PAYMENT
    }
}
```

## Event Types to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Allocate credits, create order |
| `customer.subscription.created` | Create subscription record |
| `customer.subscription.updated` | Update subscription |
| `customer.subscription.deleted` | Mark inactive |
| `invoice.paid` | Allocate monthly credits |
| `invoice.payment_failed` | Notify user, pause service |

## Race Condition Prevention

```javascript
// Webhooks can arrive out of order!
// invoice.paid may arrive before subscription.created

async function handleInvoicePaid(event) {
    const subscriptionId = event.data.object.subscription;

    // Wait for subscription with timeout
    let subscription;
    for (let i = 0; i < 5; i++) {
        subscription = await db.subscriptions.findFirst({
            where: { stripeSubscriptionId: subscriptionId }
        });
        if (subscription) break;
        await sleep(1000);
    }

    if (!subscription) {
        throw new Error('Subscription not yet created - retry');
    }

    await allocateCredits(subscription);
}
```

## Billing Events Table

```sql
CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON billing_events(stripe_event_id);
```

## Common Bugs

| Bug | Fix |
|-----|-----|
| Double credits | Check billing_events before processing |
| Lost payments | Re-throw errors to trigger retry |
| Race conditions | Wait for prerequisites with timeout |
| Wrong customer | Use `customer` field, not `customer_email` |
