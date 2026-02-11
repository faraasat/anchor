-- Phase 8: Ecosystem & Collective Intelligence Database Schema
-- Run this migration in your Supabase SQL editor

-- 1. Chore Rotations Table
CREATE TABLE IF NOT EXISTS chore_rotations (
  id TEXT PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  chore_ids TEXT[] NOT NULL DEFAULT '{}',
  member_ids TEXT[] NOT NULL DEFAULT '{}',
  current_index INTEGER NOT NULL DEFAULT 0,
  rotation_type TEXT NOT NULL CHECK (rotation_type IN ('completion', 'weekly', 'daily', 'custom')),
  rotation_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chore_rotations_circle ON chore_rotations(circle_id);

-- 2. Gentle Nudges Table
CREATE TABLE IF NOT EXISTS gentle_nudges (
  id TEXT PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL,
  assigned_user_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium')),
  missed_at TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'notified', 'acknowledged', 'resolved')) DEFAULT 'pending',
  reminder_title TEXT NOT NULL,
  reminder_due_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gentle_nudges_circle ON gentle_nudges(circle_id);
CREATE INDEX idx_gentle_nudges_owner ON gentle_nudges(owner_user_id);
CREATE INDEX idx_gentle_nudges_status ON gentle_nudges(status);

-- 3. Anchor Streaks Table
CREATE TABLE IF NOT EXISTS anchor_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_completion_date TEXT,
  total_completions INTEGER NOT NULL DEFAULT 0,
  unlocked_rewards TEXT[] NOT NULL DEFAULT '{}',
  next_milestone_days INTEGER,
  next_milestone_reward TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Community Templates Table
CREATE TABLE IF NOT EXISTS community_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  task_count INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  tasks JSONB NOT NULL DEFAULT '[]',
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_templates_category ON community_templates(category);
CREATE INDEX idx_community_templates_official ON community_templates(is_official);
CREATE INDEX idx_community_templates_author ON community_templates(author_id);

-- 5. Procrastination Profiles Table (Cache)
CREATE TABLE IF NOT EXISTS procrastination_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  top_categories JSONB NOT NULL DEFAULT '[]',
  procrastination_score INTEGER NOT NULL DEFAULT 0,
  peak_time TEXT,
  suggested_fixes JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Pattern Detections Table (Cache)
CREATE TABLE IF NOT EXISTS pattern_detections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('time', 'location', 'sequence', 'frequency')),
  confidence NUMERIC(3,2) NOT NULL,
  suggested_reminder JSONB NOT NULL,
  historical_data JSONB NOT NULL,
  shown_to_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_pattern_detections_user ON pattern_detections(user_id);
CREATE INDEX idx_pattern_detections_shown ON pattern_detections(shown_to_user);

-- 7. Privacy Settings Table
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  privacy_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  masked_tags TEXT[] NOT NULL DEFAULT '{}',
  masked_circles TEXT[] NOT NULL DEFAULT '{}',
  auto_expire_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_expire_minutes INTEGER NOT NULL DEFAULT 60,
  auto_expire_categories TEXT[] NOT NULL DEFAULT '{}',
  biometric_lock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Subscription Tiers Table (RevenueCat integration)
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

-- 9. Update household_members to support role enum
-- Note: This assumes role is already TEXT. If it's not, you'll need to alter it.
-- ALTER TABLE household_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';
-- UPDATE household_members SET role = 'owner' WHERE role IS NULL AND user_id IN (SELECT owner_id FROM households);

-- 10. Add permissions check function
CREATE OR REPLACE FUNCTION check_circle_permission(
  p_circle_id UUID,
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM household_members
  WHERE household_id = p_circle_id AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE p_permission
    WHEN 'edit' THEN
      RETURN v_role IN ('owner', 'editor');
    WHEN 'complete' THEN
      RETURN v_role IN ('owner', 'editor');
    WHEN 'assign' THEN
      RETURN v_role = 'owner';
    WHEN 'invite' THEN
      RETURN v_role = 'owner';
    WHEN 'delete' THEN
      RETURN v_role = 'owner';
    WHEN 'view_sensitive' THEN
      RETURN v_role IN ('owner', 'editor');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Add trigger to auto-rotate chores
CREATE OR REPLACE FUNCTION check_chore_rotation()
RETURNS TRIGGER AS $$
DECLARE
  v_rotation RECORD;
BEGIN
  -- Find rotations that contain this completed chore
  FOR v_rotation IN
    SELECT * FROM chore_rotations
    WHERE NEW.id = ANY(chore_ids)
      AND rotation_type = 'completion'
  LOOP
    -- Rotate to next member
    UPDATE chore_rotations
    SET
      current_index = (current_index + 1) % array_length(member_ids, 1),
      updated_at = NOW()
    WHERE id = v_rotation.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: You'll need to apply this trigger to your reminders table
-- CREATE TRIGGER trigger_chore_rotation
-- AFTER UPDATE ON reminders
-- FOR EACH ROW
-- WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
-- EXECUTE FUNCTION check_chore_rotation();

-- 12. Create function to generate gentle nudges
CREATE OR REPLACE FUNCTION generate_gentle_nudge(
  p_circle_id UUID,
  p_reminder_id UUID,
  p_assigned_user_id UUID,
  p_priority TEXT,
  p_reminder_title TEXT,
  p_reminder_due_date TEXT
) RETURNS VOID AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get circle owner
  SELECT owner_id INTO v_owner_id
  FROM households
  WHERE id = p_circle_id;

  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  -- Create nudge
  INSERT INTO gentle_nudges (
    id,
    circle_id,
    reminder_id,
    assigned_user_id,
    owner_user_id,
    priority,
    missed_at,
    reminder_title,
    reminder_due_date
  ) VALUES (
    gen_random_uuid()::TEXT,
    p_circle_id,
    p_reminder_id,
    p_assigned_user_id,
    v_owner_id,
    p_priority,
    NOW(),
    p_reminder_title,
    p_reminder_due_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable Row Level Security on new tables
ALTER TABLE chore_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gentle_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE procrastination_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies
-- Chore Rotations: Circle members can view, owners can modify
CREATE POLICY "Circle members can view rotations"
ON chore_rotations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = circle_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Circle owners can manage rotations"
ON chore_rotations FOR ALL
USING (
  check_circle_permission(circle_id, auth.uid(), 'assign')
);

-- Gentle Nudges: Owner can view their nudges
CREATE POLICY "Users can view their nudges"
ON gentle_nudges FOR SELECT
USING (owner_user_id = auth.uid() OR assigned_user_id = auth.uid());

-- Anchor Streaks: Users can only access their own
CREATE POLICY "Users can view own streak"
ON anchor_streaks FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own streak"
ON anchor_streaks FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streak"
ON anchor_streaks FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Community Templates: Everyone can view, only authors and admins can modify
CREATE POLICY "Anyone can view templates"
ON community_templates FOR SELECT
USING (true);

CREATE POLICY "Authors can manage templates"
ON community_templates FOR ALL
USING (author_id = auth.uid() OR is_official = true);

-- Privacy Settings: Users can only access their own
CREATE POLICY "Users can manage own privacy"
ON privacy_settings FOR ALL
USING (user_id = auth.uid());

-- Pattern Detections: Users can only access their own
CREATE POLICY "Users can view own patterns"
ON pattern_detections FOR SELECT
USING (user_id = auth.uid());

-- User Subscriptions: Users can only view their own
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON chore_rotations TO authenticated;
GRANT ALL ON gentle_nudges TO authenticated;
GRANT ALL ON anchor_streaks TO authenticated;
GRANT ALL ON community_templates TO authenticated;
GRANT ALL ON procrastination_profiles TO authenticated;
GRANT ALL ON pattern_detections TO authenticated;
GRANT ALL ON privacy_settings TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
