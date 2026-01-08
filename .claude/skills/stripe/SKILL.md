---
name: stripe
description: Stripe payment processing platform. Use for payment integrations, checkout, subscriptions, billing, Connect platforms, webhooks, and financial APIs.
---

# Stripe Skill

Comprehensive assistance with Stripe development, generated from official documentation.

## When to Use This Skill

This skill should be triggered when:
- Working with Stripe payments
- Implementing checkout sessions
- Setting up subscriptions and billing
- Processing webhooks
- Working with Stripe Connect

## Quick Reference

### Initialize Stripe (Node.js)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Create Payment Intent

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // Amount in cents
  currency: 'usd',
  payment_method_types: ['card'],
  metadata: { order_id: '123' }
});
```

### Create Checkout Session

```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Product Name',
        },
        unit_amount: 2000,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
});
```

### Create Subscription Checkout

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: 'price_xxx', // Price ID from Stripe dashboard
      quantity: 1,
    },
  ],
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
});
```

### Webhook Handling

```javascript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Fulfill the purchase...
      break;
    case 'invoice.paid':
      // Continue to provision the subscription
      break;
    case 'invoice.payment_failed':
      // Notify user, revoke access
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

### Retrieve Customer

```javascript
const customer = await stripe.customers.retrieve('cus_xxx');
```

### List Subscriptions

```javascript
const subscriptions = await stripe.subscriptions.list({
  customer: 'cus_xxx',
  status: 'active',
});
```

### Cancel Subscription

```javascript
const deleted = await stripe.subscriptions.cancel('sub_xxx');
```

### Create Customer Portal Session

```javascript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: 'cus_xxx',
  return_url: 'https://example.com/account',
});
```

## Key Event Types

| Event | Description |
|-------|-------------|
| `checkout.session.completed` | Payment successful |
| `customer.subscription.created` | New subscription |
| `customer.subscription.updated` | Subscription changed |
| `customer.subscription.deleted` | Subscription canceled |
| `invoice.paid` | Invoice payment successful |
| `invoice.payment_failed` | Invoice payment failed |
| `payment_intent.succeeded` | Payment completed |
| `payment_intent.payment_failed` | Payment failed |

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_xxx  # or sk_test_xxx for testing
STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # or pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Testing

Use test card numbers:
- `4242424242424242` - Successful payment
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds

## Best Practices

1. **Always verify webhooks** - Use signature verification
2. **Idempotency keys** - For safe retries on payment creation
3. **Store Stripe IDs** - Save customer_id, subscription_id in your database
4. **Handle errors gracefully** - Catch and log Stripe errors
5. **Use metadata** - Attach your internal IDs to Stripe objects

## Resources

- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
