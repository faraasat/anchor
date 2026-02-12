-- QUICK FIX: Drop problematic policies and recreate tables
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Drop all existing households policies
-- ============================================
DROP POLICY IF EXISTS "Users can view households they own" ON households;
DROP POLICY IF EXISTS "Users can view households they are members of" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Owners can update households" ON households;
DROP POLICY IF EXISTS "Owners can delete households" ON households;

-- ============================================
-- FIX 2: Recreate households table if needed
-- ============================================
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_households_owner ON households(owner_id);
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

-- ============================================
-- FIX 3: Create household_members table FIRST
-- ============================================
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- ============================================
-- FIX 4: Create user_subscriptions table
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
  revenue_cat_user_id TEXT,
  active_entitlements TEXT[] NOT NULL DEFAULT '{}',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FIX 5: Enable RLS
-- ============================================
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX 6: Create SIMPLE policies (no recursion)
-- ============================================

-- Households: Only check owner, don't check members
CREATE POLICY "Users can view households they own"
ON households FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can create households"
ON households FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update households"
ON households FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete households"
ON households FOR DELETE
USING (owner_id = auth.uid());

-- Household members: Simple policies
CREATE POLICY "Users can view their memberships"
ON household_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their households"
ON household_members FOR SELECT
USING (
  household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Household owners can manage members"
ON household_members FOR ALL
USING (
  household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
  )
);

-- User subscriptions
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
ON user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
ON user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- FIX 7: Grant permissions
-- ============================================
GRANT ALL ON households TO authenticated;
GRANT ALL ON household_members TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;

-- ============================================
-- FIX 8: Create functions if missing
-- ============================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- Done!
