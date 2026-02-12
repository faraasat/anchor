-- Critical Missing Tables - FIXED ORDER
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE ALL TABLES WITHOUT POLICIES
-- ============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create households table
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

-- 3. Create household_members table - MUST BE BEFORE HOUSEHOLD POLICIES
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

-- 4. Create nudges table
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL,
  message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nudges_recipient ON nudges(recipient_id);
CREATE INDEX IF NOT EXISTS idx_nudges_sender ON nudges(sender_id);
CREATE INDEX IF NOT EXISTS idx_nudges_read ON nudges(read_at) WHERE read_at IS NULL;

-- 5. Create anchor_points table
CREATE TABLE IF NOT EXISTS anchor_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  routine_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anchor_points_user ON anchor_points(user_id);
CREATE INDEX IF NOT EXISTS idx_anchor_points_active ON anchor_points(is_active);

-- 6. Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  due_time TEXT NOT NULL,
  tag TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'snoozed', 'completed', 'overdue')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence JSONB,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location_trigger JSONB,
  bluetooth_trigger JSONB,
  nfc_trigger TEXT,
  snoozed_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_sensitive BOOLEAN,
  sensitive_delete_at TIMESTAMPTZ,
  chain_count INTEGER DEFAULT 0,
  longest_chain INTEGER DEFAULT 0,
  last_completed_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_household ON reminders(household_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_assigned ON reminders(assigned_to);

-- 7. Create user_subscriptions table
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
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Households policies (NOW household_members exists!)
DROP POLICY IF EXISTS "Users can view households they own" ON households;
CREATE POLICY "Users can view households they own"
ON households FOR SELECT
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view households they are members of" ON households;
CREATE POLICY "Users can view households they are members of"
ON households FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create households" ON households;
CREATE POLICY "Users can create households"
ON households FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update households" ON households;
CREATE POLICY "Owners can update households"
ON households FOR UPDATE
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete households" ON households;
CREATE POLICY "Owners can delete households"
ON households FOR DELETE
USING (owner_id = auth.uid());

-- Household members policies (FIXED - NO RECURSION)
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
CREATE POLICY "Users can view household members"
ON household_members FOR SELECT
USING (
  user_id = auth.uid() 
  OR household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Household owners can manage members" ON household_members;
CREATE POLICY "Household owners can manage members"
ON household_members FOR ALL
USING (
  household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
  )
);

-- Nudges policies
DROP POLICY IF EXISTS "Users can view nudges sent to them" ON nudges;
CREATE POLICY "Users can view nudges sent to them"
ON nudges FOR SELECT
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send nudges" ON nudges;
CREATE POLICY "Users can send nudges"
ON nudges FOR INSERT
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their received nudges" ON nudges;
CREATE POLICY "Users can update their received nudges"
ON nudges FOR UPDATE
USING (recipient_id = auth.uid());

-- Anchor points policies
DROP POLICY IF EXISTS "Users can manage own anchor points" ON anchor_points;
CREATE POLICY "Users can manage own anchor points"
ON anchor_points FOR ALL
USING (user_id = auth.uid());

-- Reminders policies
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders"
ON reminders FOR SELECT
USING (user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can create reminders" ON reminders;
CREATE POLICY "Users can create reminders"
ON reminders FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders"
ON reminders FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
CREATE POLICY "Users can delete own reminders"
ON reminders FOR DELETE
USING (user_id = auth.uid());

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Users can update own subscription"
ON user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own subscription" ON user_subscriptions;
CREATE POLICY "Users can insert own subscription"
ON user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================

GRANT ALL ON profiles TO authenticated;
GRANT ALL ON households TO authenticated;
GRANT ALL ON household_members TO authenticated;
GRANT ALL ON nudges TO authenticated;
GRANT ALL ON anchor_points TO authenticated;
GRANT ALL ON reminders TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Invite code generator
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

-- ============================================
-- STEP 6: CREATE AUTO-TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

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

-- ============================================
-- DONE! All tables, policies, and triggers created.
-- ============================================
