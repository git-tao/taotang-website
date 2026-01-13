-- Migration: 002_add_business_ops_manager_role
-- Description: Add business_ops_manager to role_title enum
-- Created: 2026-01-13

-- Add the new enum value
-- Note: ADD VALUE cannot be run inside a transaction in PostgreSQL
ALTER TYPE role_title ADD VALUE IF NOT EXISTS 'business_ops_manager' BEFORE 'ic_engineer';
