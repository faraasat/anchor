-- Fix household RLS recursion and add nudges -> reminders FK

CREATE OR REPLACE FUNCTION is_household_member(target_household uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM household_members hm
    WHERE hm.household_id = target_household
      AND hm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_household_owner(target_household uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM households h
    WHERE h.id = target_household
      AND h.owner_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view households they own" ON households;
DROP POLICY IF EXISTS "Users can view households they are members of" ON households;
CREATE POLICY "Users can view households they own"
ON households FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can view households they are members of"
ON households FOR SELECT
USING (is_household_member(id));

DROP POLICY IF EXISTS "Users can view household members" ON household_members;
CREATE POLICY "Users can view household members"
ON household_members FOR SELECT
USING (
  user_id = auth.uid()
  OR is_household_member(household_id)
);

DROP POLICY IF EXISTS "Household owners can manage members" ON household_members;
CREATE POLICY "Household owners can manage members"
ON household_members FOR ALL
USING (is_household_owner(household_id))
WITH CHECK (is_household_owner(household_id));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nudges_reminder_id_fkey'
  ) THEN
    ALTER TABLE nudges
    ADD CONSTRAINT nudges_reminder_id_fkey
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE;
  END IF;
END $$;
