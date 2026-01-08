---
name: contract-validation
description: "Validates frontend-backend API contracts. Apply when modifying API endpoints or service files."
---

# Contract Validation Skill

Ensures frontend and backend API contracts remain synchronized.

## When to Apply

- Modifying API endpoints (backend)
- Modifying service/API calls (frontend)
- Adding new endpoints
- Changing request/response schemas

## Core Rules

### 1. Schema Consistency

Backend response MUST match frontend TypeScript interface:

```python
# Backend (Python/FastAPI)
class UserResponse(BaseModel):
    user_id: str
    email: str
    created_at: datetime
```

```typescript
// Frontend (TypeScript)
interface UserResponse {
    user_id: string;      // str -> string
    email: string;
    created_at: string;   // datetime -> ISO string
}
```

### 2. Endpoint Existence

Every frontend API call needs a backend endpoint:

```typescript
// Frontend
export const getUser = (id: string) => api.get(`/users/${id}`);
```

```python
# Backend MUST have:
@router.get("/users/{user_id}")
async def get_user(user_id: str) -> UserResponse:
    ...
```

### 3. Use Centralized API Client

```typescript
// CORRECT
import api from '../utils/api';
const response = await api.get('/users/123');

// WRONG - direct axios/fetch
import axios from 'axios';
const response = await axios.get('http://localhost:8000/api/users/123');
```

## Common Mismatches

### Snake Case vs Camel Case

```python
# Backend returns
{"user_id": "123", "created_at": "2025-01-01"}
```

```typescript
// Frontend expects - MISMATCH!
interface User {
    userId: string;     // Wrong: should be user_id
    createdAt: string;  // Wrong: should be created_at
}
```

### Optional vs Required

```python
# Backend - field is optional
class Response(BaseModel):
    data: Optional[str] = None
```

```typescript
// Frontend - assumes required - BUG!
interface Response {
    data: string;  // Should be: data?: string
}
```

### Enum Mismatches

```python
# Backend: lowercase
class Status(str, Enum):
    PENDING = "pending"
```

```typescript
// Frontend: uppercase - WRONG
type Status = "PENDING";  // Should be "pending"
```

## Verification Commands

```bash
# Find backend routes
grep -rn "@router\." backend/ --include="*.py"
grep -rn "router\.\(get\|post\)" backend/ --include="*.ts"

# Find frontend API calls
grep -rn "api\.\(get\|post\)" src/ --include="*.ts"
```

## Checklist

- [ ] Backend endpoint exists for frontend call
- [ ] HTTP methods match
- [ ] Field names match (snake_case)
- [ ] Field types match
- [ ] Optional fields marked with `?`
- [ ] Enum values match exactly
