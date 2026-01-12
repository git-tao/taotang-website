#!/usr/bin/env python3
"""
Apply SQL migrations to Supabase database.

Usage:
    python scripts/apply_migration.py

This script reads the migration file and prints it for manual execution
in the Supabase SQL editor, since the PostgREST API doesn't support raw SQL.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    migration_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "supabase",
        "migrations",
        "002_ai_assistant.sql",
    )

    if not os.path.exists(migration_path):
        print(f"ERROR: Migration file not found at {migration_path}")
        sys.exit(1)

    print("=" * 70)
    print("AI ASSISTANT MIGRATION")
    print("=" * 70)
    print()
    print("The ai_sessions and ai_turns tables need to be created in Supabase.")
    print()
    print("To apply this migration:")
    print("1. Go to your Supabase dashboard: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to SQL Editor (left sidebar)")
    print("4. Click 'New Query'")
    print("5. Paste the SQL below and click 'Run'")
    print()
    print("=" * 70)
    print("SQL TO EXECUTE:")
    print("=" * 70)
    print()

    with open(migration_path, "r") as f:
        print(f.read())

    print()
    print("=" * 70)
    print("After running the migration, the E2E tests should pass.")
    print("=" * 70)


if __name__ == "__main__":
    main()
