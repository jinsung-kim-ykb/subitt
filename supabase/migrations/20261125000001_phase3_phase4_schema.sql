-- Phase 3 & 4 Tables Migration

-- 1. Profiles Table Role & Notification Settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS notification_days_before INTEGER[] DEFAULT '{3, 1}',
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE;

-- 2. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'desktop',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Notifications Table (Idempotent Notification Storage)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_scheduled ON public.notifications(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notifications(idempotency_key);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Plan Catalog Table (Phase 4 - Admin edited)
CREATE TABLE IF NOT EXISTS public.plan_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KRW',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    features TEXT,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.plan_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan catalog"
ON public.plan_catalog FOR SELECT
USING (true);

CREATE POLICY "Only admins can edit plan catalog"
ON public.plan_catalog FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Bundle Rules Table (Phase 4 - Admin edited)
CREATE TABLE IF NOT EXISTS public.bundle_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    bundle_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    discounted_amount NUMERIC NOT NULL,
    original_amount NUMERIC NOT NULL,
    condition TEXT NOT NULL,
    action_url TEXT NOT NULL,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bundle_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bundle rules"
ON public.bundle_rules FOR SELECT
USING (true);

CREATE POLICY "Only admins can edit bundle rules"
ON public.bundle_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Dismissed Recommendations Table (Phase 4 - "해당 없음" 기록)
CREATE TABLE IF NOT EXISTS public.dismissed_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, recommendation_key)
);

ALTER TABLE public.dismissed_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their dismissed recommendations"
ON public.dismissed_recommendations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
