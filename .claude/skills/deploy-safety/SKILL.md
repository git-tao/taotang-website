---
name: deploy-safety
description: "Ensures deployments go to correct environments. Apply when deploying or pushing to production."
---

# Deploy Safety Skill

Safe deployment patterns for modern web applications.

## When to Apply

- User mentions "deploy", "push to production", "ship it"
- Before any `git push` to main/production
- When discussing deployment targets
- Changes span frontend and backend

## Pre-Deployment Checklist

### 1. Correct Branch

```bash
git branch --show-current
# Confirm this is the intended branch
```

### 2. What Changed

```bash
# Files changed
git diff --name-only origin/main...HEAD

# Frontend vs backend changes
git diff --name-only origin/main...HEAD | grep -E "^src/" | wc -l
git diff --name-only origin/main...HEAD | grep -E "^backend/" | wc -l
```

### 3. Clean Working Directory

```bash
git status --porcelain
# Should be empty
```

### 4. Tests Pass

```bash
npm test
npm run build
```

## Deployment Rules

### Frontend-Only Changes

If changes are ONLY in `src/`:
- Push to main, Vercel auto-deploys
- No backend action needed

### Backend-Only Changes

If changes are ONLY in `backend/`:
- Deploy to backend platform
- Verify API contracts unchanged

### Mixed Changes (FE + BE)

If changes span both:
- Verify API contracts match
- Deploy backend first (usually)
- Then deploy frontend

### Database Migrations

If migrations included:
- Test in staging first
- Have rollback plan ready
- Run migration before code deployment

## Vercel Commands

```bash
vercel                  # Deploy preview
vercel --prod           # Deploy production
vercel ls               # List deployments
vercel logs [url]       # View logs
vercel env add VAR      # Add env variable
vercel env pull         # Pull env to local
```

## Post-Deployment Verification

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Check for errors
# - Browser console
# - Server logs
# - Error tracking (Sentry, etc.)
```

## Rollback

If deployment fails:

1. **Vercel/Netlify**: Instant rollback via dashboard
2. **Backend**: `git revert` and redeploy
3. **Database**: Run rollback migration

## Environment Variables

Verify before deploy:

```bash
# Frontend (public)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_URL=...

# Backend (private - never expose)
DATABASE_URL=...
STRIPE_SECRET_KEY=...
```
