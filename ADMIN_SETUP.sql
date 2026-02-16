-- ════════════════════════════════════════════════════════════════
-- ADMIN SETUP — Grant admin role to virag@deltasystem.in
-- ════════════════════════════════════════════════════════════════

-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- Grant admin role to virag@deltasystem.in
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';

-- Verify the update
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';

-- Expected result:
-- email: virag@deltasystem.in
-- role: admin
