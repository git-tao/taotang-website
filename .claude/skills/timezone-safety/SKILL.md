---
name: timezone-safety
description: "Prevents timezone-related bugs. Apply when working with dates, times, or timestamps."
---

# Timezone Safety Skill

Prevents timezone bugs from mixing naive and aware datetimes.

## When to Apply

- Any Date/datetime usage
- Timestamp fields in database
- API responses with dates
- Date comparisons
- Storing/retrieving timestamps

## Core Rules

### 1. Always Use UTC Internally

**JavaScript/TypeScript:**
```typescript
// Get UTC timestamp
const now = new Date();
const utcString = now.toISOString();  // "2025-01-07T12:00:00.000Z"

// Parse ISO string (preserves UTC)
const parsed = new Date("2025-01-07T12:00:00.000Z");
```

**Python:**
```python
from datetime import datetime, UTC

# CORRECT
now = datetime.now(UTC)

# WRONG - naive datetime
now = datetime.now()      # No timezone!
now = datetime.utcnow()   # Deprecated, still naive!
```

### 2. Database: Use TIMESTAMPTZ

```sql
-- CORRECT
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- WRONG - ambiguous timezone
created_at TIMESTAMP
```

### 3. API Responses: ISO Format

```typescript
// CORRECT - ISO 8601 with timezone
return { created_at: order.createdAt.toISOString() };
// Returns: "2025-01-15T10:30:00.000Z"

// WRONG - loses timezone
return { created_at: order.createdAt.toLocaleDateString() };
```

### 4. Display: Convert at UI Layer

```typescript
// Backend sends UTC, frontend converts for display
const utcDate = new Date(response.created_at);
const localDisplay = utcDate.toLocaleString();

// Better formatting
const formatted = utcDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});
```

## Common Bugs

### Stripe Timestamps

```typescript
// Stripe returns Unix seconds
const stripeTimestamp = event.created;  // 1705312200

// WRONG - missing * 1000
const date = new Date(stripeTimestamp);

// CORRECT - convert to milliseconds
const date = new Date(stripeTimestamp * 1000);
```

### Date Comparison

```typescript
// WRONG - may compare different timezones
if (expiresAt < new Date()) { ... }

// CORRECT - compare timestamps
if (new Date(expiresAt).getTime() < Date.now()) { ... }
```

### Token Expiration

```typescript
// Store as UTC timestamp
const expiresAt = new Date(Date.now() + 3600000).toISOString();

// Compare correctly
const isExpired = new Date(token.expiresAt).getTime() < Date.now();
```

## Best Practices

| What | How |
|------|-----|
| Store | Always TIMESTAMPTZ |
| Create | `new Date().toISOString()` |
| API response | ISO 8601 with Z suffix |
| Display | Convert to local at UI layer |
| Compare | Use `.getTime()` timestamps |
| Stripe | Multiply by 1000 |

## Detection

```bash
# Find potential issues
grep -rn "new Date()" src/
grep -rn "datetime.now()" backend/
grep -rn "TIMESTAMP[^T]" --include="*.sql"
```
