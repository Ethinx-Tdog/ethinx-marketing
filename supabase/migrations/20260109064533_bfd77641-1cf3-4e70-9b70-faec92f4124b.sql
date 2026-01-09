-- 1. Add subscription and credit tables
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due')),
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  interval TEXT CHECK (interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_top_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Credit transactions ledger
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'usage', 'bonus', 'refund', 'referral')),
  description TEXT,
  order_id UUID REFERENCES orders(id),
  subscription_id UUID REFERENCES subscriptions(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pricing plans configuration
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  interval TEXT CHECK (interval IN ('one_time', 'month', 'year')),
  credits_included INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default pricing plans
INSERT INTO pricing_plans (id, name, description, price_cents, interval, credits_included, features, display_order) VALUES
  ('basic_one_time', 'Basic', 'Standard processing', 1900, 'one_time', 1, '["Standard processing", "24h turnaround", "Basic email"]', 1),
  ('pro_one_time', 'Pro', 'Priority service', 4900, 'one_time', 1, '["Priority queue", "4h turnaround", "Detailed report", "Slack alerts"]', 2),
  ('enterprise_one_time', 'Enterprise', 'Maximum speed', 14900, 'one_time', 1, '["Immediate processing", "Dedicated agent", "API access", "White-label"]', 3),
  ('starter_monthly', 'Starter Monthly', 'For light users', 1000, 'month', 5, '["5 credits/month", "Standard queue", "Email support"]', 4),
  ('pro_monthly', 'Pro Monthly', 'For power users', 2500, 'month', 15, '["15 credits/month", "Priority queue", "Detailed reports", "Slack integration"]', 5),
  ('annual_pro', 'Pro Annual', 'Best value (Save 20%)', 24000, 'year', 180, '["15 credits/month", "Priority queue", "All features", "VIP support"]', 6);

-- 6. Add plan_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES pricing_plans(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active, display_order);

-- 8. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. RLS Policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access credits" ON user_credits FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all credits" ON user_credits FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all transactions" ON credit_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. RLS Policies for pricing_plans (public read)
CREATE POLICY "Anyone can view active plans" ON pricing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access plans" ON pricing_plans FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can manage plans" ON pricing_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 13. Update trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Update trigger for user_credits
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();