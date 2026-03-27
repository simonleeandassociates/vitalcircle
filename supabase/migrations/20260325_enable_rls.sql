-- =============================================================
-- VitalCircle — RLS Migration
-- Run in Supabase SQL Editor
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.family_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages       ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- USERS
-- =============================================================

DROP POLICY IF EXISTS "Users can read own data"      ON public.users;
DROP POLICY IF EXISTS "Users can update own data"    ON public.users;
DROP POLICY IF EXISTS "Users can insert own data"    ON public.users;
DROP POLICY IF EXISTS "Service role bypass on users" ON public.users;

-- Any authenticated user can read any user profile
-- (needed so family members can see the senior's name in messages/dashboard)
CREATE POLICY "Authenticated users can read profiles" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own row
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow a user to insert their own profile row on sign-up
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role can do anything (required for Edge Functions)
CREATE POLICY "Service role bypass on users" ON public.users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================
-- FAMILY GROUPS
-- =============================================================

DROP POLICY IF EXISTS "Users can view their groups"       ON public.family_groups;
DROP POLICY IF EXISTS "Service role bypass on groups"     ON public.family_groups;

-- Users can see a group only if they are a member of it
CREATE POLICY "Users can view their groups" ON public.family_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.group_id = family_groups.id
        AND family_members.user_id  = auth.uid()
    )
  );

CREATE POLICY "Service role bypass on family_groups" ON public.family_groups
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================
-- FAMILY MEMBERS
-- =============================================================

DROP POLICY IF EXISTS "Users can view family members"          ON public.family_members;
DROP POLICY IF EXISTS "Service role bypass on family_members"  ON public.family_members;

-- A user can see all members of any group they themselves belong to
CREATE POLICY "Users can view family members" ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = family_members.group_id
        AND fm.user_id  = auth.uid()
    )
  );

CREATE POLICY "Service role bypass on family_members" ON public.family_members
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================
-- CHECKINS
-- =============================================================

DROP POLICY IF EXISTS "Users can view own checkins"       ON public.checkins;
DROP POLICY IF EXISTS "Family can view group checkins"    ON public.checkins;
DROP POLICY IF EXISTS "Users can create own checkins"     ON public.checkins;
DROP POLICY IF EXISTS "Service role bypass on checkins"   ON public.checkins;

-- Seniors can see their own check-ins
CREATE POLICY "Users can view own checkins" ON public.checkins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Family members can see check-ins from seniors in their group
CREATE POLICY "Family can view group checkins" ON public.checkins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members fm_family
      JOIN public.family_members fm_senior ON fm_senior.group_id = fm_family.group_id
      WHERE fm_family.user_id  = auth.uid()
        AND fm_senior.user_id  = checkins.user_id
    )
  );

-- Users can only insert their own check-in rows
CREATE POLICY "Users can create own checkins" ON public.checkins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role bypass on checkins" ON public.checkins
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================
-- MEDICATIONS  (keyed by group_id, not user_id)
-- =============================================================

DROP POLICY IF EXISTS "Group members can view medications"   ON public.medications;
DROP POLICY IF EXISTS "Family can manage medications"        ON public.medications;
DROP POLICY IF EXISTS "Service role bypass on medications"   ON public.medications;

-- Any member of the group can read medications
CREATE POLICY "Group members can view medications" ON public.medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.group_id = medications.group_id
        AND family_members.user_id  = auth.uid()
    )
  );

-- Family members (role = 'family') can insert/update/delete medications
CREATE POLICY "Family can manage medications" ON public.medications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.group_id = medications.group_id
        AND family_members.user_id  = auth.uid()
        AND family_members.role     = 'family'
    )
  );

CREATE POLICY "Service role bypass on medications" ON public.medications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================
-- MESSAGES  (keyed by group_id + sender_id)
-- =============================================================

DROP POLICY IF EXISTS "Group members can view messages"   ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages"   ON public.messages;
DROP POLICY IF EXISTS "Service role bypass on messages"   ON public.messages;

-- Any group member can read all messages in their group
CREATE POLICY "Group members can view messages" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.group_id = messages.group_id
        AND family_members.user_id  = auth.uid()
    )
  );

-- Any group member can send a message, but only as themselves
CREATE POLICY "Group members can send messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.group_id = messages.group_id
        AND family_members.user_id  = auth.uid()
    )
  );

CREATE POLICY "Service role bypass on messages" ON public.messages
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
