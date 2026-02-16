-- ════════════════════════════════════════════════════════════════
-- PROPOSALKIT ADMIN PANEL - DATABASE SCHEMA
-- ════════════════════════════════════════════════════════════════

-- 1. Extend profiles table with admin role
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'superadmin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IN ('admin', 'superadmin');
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile (except role)" ON profiles;
CREATE POLICY "Users can update own profile (except role)" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Superadmins can update all profiles" ON profiles;
CREATE POLICY "Superadmins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );


-- 2. Subscriptions table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan details
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),

  -- Razorpay data
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_plan_id TEXT,

  -- Billing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Pricing
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'INR',
  interval TEXT CHECK (interval IN ('month', 'year')),

  -- Admin controls
  is_admin_granted BOOLEAN DEFAULT FALSE,
  granted_by UUID REFERENCES profiles(id),
  granted_reason TEXT,
  granted_expires_at TIMESTAMPTZ,

  -- Usage tracking
  proposals_created INTEGER DEFAULT 0,
  proposals_limit INTEGER,
  clients_created INTEGER DEFAULT 0,
  storage_used_mb DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, status) WHERE status = 'active'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_customer ON subscriptions(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. Payment history table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),

  -- Razorpay data
  razorpay_payment_id TEXT,
  razorpay_invoice_id TEXT,
  razorpay_order_id TEXT,

  -- Metadata
  description TEXT,
  receipt_url TEXT,
  failure_message TEXT,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON payment_history(paid_at DESC);

-- RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payment_history;
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payment_history;
CREATE POLICY "Admins can view all payments" ON payment_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );


-- 4. Tickets table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- User info (for non-logged-in users)
  user_email TEXT NOT NULL,
  user_name TEXT,
  device_id TEXT,

  -- Ticket details
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'billing', 'technical', 'general', 'account')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting', 'resolved', 'closed')),

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),

  -- Communication
  messages JSONB DEFAULT '[]',
  internal_notes JSONB DEFAULT '[]',

  -- Submission context
  submission_method TEXT DEFAULT 'online' CHECK (submission_method IN ('online', 'offline')),
  page_url TEXT,
  user_agent TEXT,
  browser_info JSONB,

  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_email ON tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_messages ON tickets USING GIN(messages);

-- RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can update own tickets (add messages)" ON tickets;
CREATE POLICY "Users can update own tickets (add messages)" ON tickets
  FOR UPDATE USING (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets" ON tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;
CREATE POLICY "Admins can manage all tickets" ON tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5. Admin audit log
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,

  -- Target
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email TEXT,

  -- Details
  changes JSONB,
  metadata JSONB DEFAULT '{}',

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON admin_audit_log;
CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "System can insert audit log" ON admin_audit_log;
CREATE POLICY "System can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (TRUE);


-- 6. Announcements table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')),

  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'pro', 'team', 'admins')),
  target_user_ids UUID[],

  -- Display
  is_dismissible BOOLEAN DEFAULT TRUE,
  show_on_login BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_label TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Schedule
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_audience);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view active announcements" ON announcements;
CREATE POLICY "Users can view active announcements" ON announcements
  FOR SELECT USING (is_active = TRUE AND NOW() BETWEEN starts_at AND COALESCE(expires_at, 'infinity'));

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );


-- 7. Email queue table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Content
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Variables
  template_data JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Error tracking
  error_message TEXT,
  last_attempt_at TIMESTAMPTZ,

  -- Timestamps
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_to_email ON email_queue(to_email);

-- RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email queue" ON email_queue;
CREATE POLICY "Admins can view email queue" ON email_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );


-- 8. Helper functions
-- ════════════════════════════════════════════════════════════════

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user subscription
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  status TEXT,
  proposals_limit INTEGER,
  proposals_created INTEGER,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.plan, s.status, s.proposals_limit, s.proposals_created, s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can create proposal
CREATE OR REPLACE FUNCTION can_create_proposal(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub FROM get_user_subscription(p_user_id);

  IF NOT FOUND THEN
    RETURN (SELECT COUNT(*) FROM proposals WHERE user_id = p_user_id) < 5;
  END IF;

  IF v_sub.proposals_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN v_sub.proposals_created < v_sub.proposals_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment proposal count
CREATE OR REPLACE FUNCTION increment_proposal_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET proposals_created = proposals_created + 1
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant free subscription
CREATE OR REPLACE FUNCTION grant_free_subscription(
  p_user_id UUID,
  p_plan TEXT,
  p_duration_days INTEGER,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_admin_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can grant subscriptions';
  END IF;

  v_admin_id := auth.uid();

  UPDATE subscriptions
  SET status = 'canceled', canceled_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  INSERT INTO subscriptions (
    user_id, plan, status,
    current_period_start, current_period_end,
    is_admin_granted, granted_by, granted_reason, granted_expires_at,
    proposals_limit
  ) VALUES (
    p_user_id, p_plan, 'active',
    NOW(), NOW() + (p_duration_days || ' days')::INTERVAL,
    TRUE, v_admin_id, p_reason, NOW() + (p_duration_days || ' days')::INTERVAL,
    CASE p_plan
      WHEN 'free' THEN 5
      WHEN 'pro' THEN 50
      WHEN 'team' THEN NULL
    END
  )
  RETURNING id INTO v_subscription_id;

  INSERT INTO admin_audit_log (
    admin_id, action, resource_type, resource_id,
    target_user_id, changes
  ) VALUES (
    v_admin_id, 'grant_subscription', 'subscription', v_subscription_id::TEXT,
    p_user_id, jsonb_build_object('plan', p_plan, 'duration_days', p_duration_days, 'reason', p_reason)
  );

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Analytics views
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW admin_mrr_by_month AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  plan,
  COUNT(*) AS subscribers,
  SUM(amount) AS monthly_revenue,
  currency
FROM subscriptions
WHERE status IN ('active', 'trialing')
  AND interval = 'month'
GROUP BY month, plan, currency
ORDER BY month DESC;

CREATE OR REPLACE VIEW admin_churn_metrics AS
SELECT
  DATE_TRUNC('month', canceled_at) AS month,
  COUNT(*) AS canceled_count,
  plan,
  AVG(EXTRACT(EPOCH FROM (canceled_at - current_period_start)) / 86400) AS avg_days_subscribed
FROM subscriptions
WHERE canceled_at IS NOT NULL
GROUP BY month, plan
ORDER BY month DESC;

CREATE OR REPLACE VIEW admin_ticket_metrics AS
SELECT
  status,
  priority,
  category,
  COUNT(*) AS ticket_count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600) AS avg_resolution_hours,
  COUNT(CASE WHEN submission_method = 'offline' THEN 1 END) AS offline_count,
  AVG(satisfaction_rating) AS avg_satisfaction
FROM tickets
GROUP BY status, priority, category;

CREATE OR REPLACE VIEW admin_user_growth AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS cumulative_users
FROM profiles
GROUP BY month
ORDER BY month DESC;


-- ════════════════════════════════════════════════════════════════
-- SETUP COMPLETE
-- ════════════════════════════════════════════════════════════════

-- To set yourself as admin, run:
-- UPDATE profiles SET role = 'superadmin' WHERE email = 'your-email@example.com';
