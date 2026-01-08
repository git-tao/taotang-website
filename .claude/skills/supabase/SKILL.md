---
name: supabase
description: Supabase open-source Firebase alternative with PostgreSQL database, authentication, storage, real-time subscriptions, and edge functions
---

# Supabase Skill

Comprehensive assistance with Supabase development - the open-source Firebase alternative with PostgreSQL database, Auth, Storage, Realtime, and Edge Functions.

## When to Use This Skill

This skill should be triggered when:
- Working with Supabase database, auth, storage, or realtime
- Building full-stack applications with PostgreSQL
- Implementing user authentication and authorization
- Working with Row Level Security (RLS)
- Building real-time features with subscriptions
- Deploying Edge Functions (Deno)
- Using Supabase with React, Next.js, Vue, Flutter, etc.

## Quick Reference

### Initialize Supabase Client (JavaScript)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)
```

### Initialize for Server-Side (Next.js)

```javascript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Authentication

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in with email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in with OAuth (Google, GitHub, etc.)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
})
```

### Database Queries

```javascript
// SELECT
const { data, error } = await supabase
  .from('posts')
  .select('*')

// SELECT with relations
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users(name, email)
  `)

// INSERT
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', content: 'World' })
  .select()

// UPDATE
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', 1)
  .select()

// DELETE
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', 1)

// UPSERT
const { data, error } = await supabase
  .from('posts')
  .upsert({ id: 1, title: 'Upserted' })
  .select()
```

### Query Filters

```javascript
.eq('column', 'value')      // Equality
.neq('column', 'value')     // Not equal
.gt('column', 10)           // Greater than
.lt('column', 100)          // Less than
.gte('column', 10)          // Greater than or equal
.lte('column', 100)         // Less than or equal
.like('column', '%pattern%')      // Pattern matching
.ilike('column', '%pattern%')     // Case insensitive
.in('column', ['a', 'b', 'c'])    // IN array
.is('column', null)               // IS NULL
.order('created_at', { ascending: false })  // Ordering
.range(0, 9)                // Pagination (first 10)
.limit(10)                  // Limit results
```

### Row Level Security (RLS)

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own posts
CREATE POLICY "Users can read own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own posts
CREATE POLICY "Users can insert own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Public read access
CREATE POLICY "Public read access"
ON posts FOR SELECT
TO anon
USING (true);
```

### Storage

```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user1/avatar.png', file)

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user1/avatar.png')

// Create signed URL (temporary access)
const { data, error } = await supabase.storage
  .from('private-bucket')
  .createSignedUrl('path/to/file.pdf', 3600)

// Delete file
const { error } = await supabase.storage
  .from('avatars')
  .remove(['user1/avatar.png'])
```

### Realtime Subscriptions

```javascript
// Subscribe to database changes
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
supabase.removeChannel(channel)
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
```

## CLI Commands

```bash
supabase init                    # Initialize project
supabase start                   # Start local development
supabase stop                    # Stop local development
supabase link --project-ref xxx  # Link to remote project
supabase db push                 # Push database migrations
supabase db pull                 # Pull remote schema
supabase migration new name      # Create new migration
supabase gen types typescript --local > types/supabase.ts  # Generate types
supabase functions deploy name   # Deploy Edge Functions
```

## Key Concepts

- **Anon Key**: Safe for client-side, respects RLS policies
- **Service Role Key**: Bypasses RLS, server-side only, never expose to client
- **RLS**: Enabled per-table, use `auth.uid()` to get current user's ID

## Resources

- **Dashboard**: https://supabase.com/dashboard
- **Documentation**: https://supabase.com/docs
