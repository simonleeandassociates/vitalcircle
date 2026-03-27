-- =============================================================
-- VitalCircle — Invite Code Migration
-- Run in Supabase SQL Editor
-- =============================================================

-- Add invite_code to family_groups
ALTER TABLE public.family_groups
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE;

ALTER TABLE public.family_groups
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fast lookup by invite code
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code
  ON public.family_groups (invite_code);

-- =============================================================
-- FAMILY GROUPS — updated RLS
-- =============================================================

-- Allow any authenticated user to read groups
-- (needed for invite code lookup *before* membership exists)
DROP POLICY IF EXISTS "Users can view their groups"           ON public.family_groups;
DROP POLICY IF EXISTS "Authenticated users can read groups"   ON public.family_groups;
CREATE POLICY "Authenticated users can read groups" ON public.family_groups
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to create a family group (seniors only in practice)
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.family_groups;
CREATE POLICY "Authenticated users can create groups" ON public.family_groups
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================
-- FAMILY MEMBERS — allow users to insert themselves into groups
-- =============================================================

DROP POLICY IF EXISTS "Users can join groups" ON public.family_members;
CREATE POLICY "Users can join groups" ON public.family_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
