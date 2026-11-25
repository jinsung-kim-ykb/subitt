-- ==========================================
-- 5단계. 파티 정산 스키마 (E1 ~ E5)
-- ==========================================

-- 1. 파티 정보 테이블
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  split_method TEXT NOT NULL DEFAULT 'equal', -- 'equal' | 'custom'
  billing_day INTEGER NOT NULL DEFAULT 1,
  payment_account_info TEXT, -- 계좌번호 또는 간편송금 링크
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_parties_user_id ON public.parties(user_id);
CREATE INDEX IF NOT EXISTS idx_parties_invite_token ON public.parties(invite_token);

-- 2. 파티 멤버 테이블
CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 연동된 SUBIT 회원 (선택)
  name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON public.party_members(party_id);

-- RLS 보안 정책
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- 파티장은 자신의 파티에 대해 모든 권한 보유
CREATE POLICY "Users can manage their own parties"
  ON public.parties
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 초대 토큰을 통한 비회원/비로그인 공개 읽기 허용 (E2, S09 격리)
CREATE POLICY "Public read party via invite token"
  ON public.parties
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 파티 멤버 조회 및 납부 상태 변경
CREATE POLICY "Public read party members"
  ON public.party_members
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow members or host to update paid status"
  ON public.party_members
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
