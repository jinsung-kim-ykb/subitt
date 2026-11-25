-- subscriptions table definition
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KRW',
    cycle TEXT NOT NULL DEFAULT 'monthly',
    billing_day INTEGER,
    first_payment_date DATE,
    next_billing_date DATE,
    is_free_trial BOOLEAN DEFAULT FALSE,
    trial_end_date DATE,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
ON public.subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
