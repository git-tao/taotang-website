---
name: postgresql-table-design
description: Design a PostgreSQL-specific schema. Covers best-practices, data types, indexing, constraints, performance patterns, and advanced features
---

# PostgreSQL Table Design

## Core Rules

- Define a **PRIMARY KEY** for reference tables. Prefer `BIGINT GENERATED ALWAYS AS IDENTITY`; use `UUID` only when global uniqueness is needed.
- **Normalize first (to 3NF)** to eliminate data redundancy; denormalize **only** for measured performance needs.
- Add **NOT NULL** everywhere it's semantically required; use **DEFAULT**s for common values.
- Create **indexes for access paths you actually query**: PK/unique (auto), **FK columns (manual!)**, frequent filters/sorts.
- Prefer **TIMESTAMPTZ** for event time; **NUMERIC** for money; **TEXT** for strings; **BIGINT** for integers.

## PostgreSQL "Gotchas"

- **Identifiers**: unquoted names are lowercased. Use `snake_case`.
- **Unique + NULLs**: UNIQUE allows multiple NULLs. Use `NULLS NOT DISTINCT` (PG15+) to restrict.
- **FK indexes**: PostgreSQL **does not** auto-index FK columns. Add them manually.
- **No silent coercions**: length/precision overflows error out (no truncation).
- **Sequences have gaps**: Normal behavior, don't try to "fix" it.

## Data Types

| Use Case | Recommended Type |
|----------|------------------|
| IDs | `BIGINT GENERATED ALWAYS AS IDENTITY` or `UUID` |
| Integers | `BIGINT` (prefer) or `INTEGER` |
| Strings | `TEXT` (not `VARCHAR(n)` or `CHAR(n)`) |
| Money | `NUMERIC(p,s)` (never float) |
| Timestamps | `TIMESTAMPTZ` (not `TIMESTAMP`) |
| Booleans | `BOOLEAN NOT NULL` |
| JSON data | `JSONB` (not `JSON`) |

### Do Not Use

- `timestamp` without time zone - use `timestamptz`
- `char(n)` or `varchar(n)` - use `text`
- `money` type - use `numeric`
- `serial` - use `generated always as identity`

## Constraints

- **PK**: implicit UNIQUE + NOT NULL; creates B-tree index
- **FK**: specify `ON DELETE/UPDATE` action; add explicit index on referencing column
- **UNIQUE**: creates B-tree index; allows multiple NULLs unless `NULLS NOT DISTINCT`
- **CHECK**: row-local constraints; NULL values pass

## Indexing

| Index Type | Use Case |
|------------|----------|
| B-tree | Default for equality/range queries |
| GIN | JSONB, arrays, full-text search |
| GiST | Ranges, geometry, exclusion constraints |
| BRIN | Very large, naturally ordered data |

```sql
-- Composite index (order matters)
CREATE INDEX ON orders (user_id, created_at);

-- Partial index
CREATE INDEX ON orders (user_id) WHERE status = 'active';

-- Expression index
CREATE INDEX ON users (LOWER(email));

-- Covering index
CREATE INDEX ON orders (id) INCLUDE (status, total);
```

## Row-Level Security

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own posts"
ON posts FOR SELECT
USING (user_id = auth.uid());
```

## Examples

### Users Table

```sql
CREATE TABLE users (
  user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON users (LOWER(email));
```

### Orders Table

```sql
CREATE TABLE orders (
  order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CANCELED')),
  total NUMERIC(10,2) NOT NULL CHECK (total > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON orders (user_id);
CREATE INDEX ON orders (created_at);
```

### JSONB Usage

```sql
CREATE TABLE profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(user_id),
  attrs JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX ON profiles USING GIN (attrs);

-- Query JSONB
SELECT * FROM profiles WHERE attrs @> '{"theme": "dark"}';
```
