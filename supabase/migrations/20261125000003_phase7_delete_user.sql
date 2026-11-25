-- ====================================================================
-- Phase 7: Account Deletion (회원 탈퇴 및 서버 데이터 영구 삭제)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. 사용자의 구독 정보 삭제
  DELETE FROM public.subscriptions WHERE user_id = current_user_id;

  -- 2. 사용자의 파티 및 파티 멤버 삭제
  DELETE FROM public.parties WHERE user_id = current_user_id;
  DELETE FROM public.party_members WHERE user_id = current_user_id;

  -- 3. 알림 및 웹 푸시 구독 삭제
  DELETE FROM public.notifications WHERE user_id = current_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = current_user_id;

  -- 4. 숨긴 추천 내역 삭제
  DELETE FROM public.dismissed_recommendations WHERE user_id = current_user_id;

  -- 5. 프로필 정보 삭제
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- 6. auth.users 레코드 삭제 (Security Definer 실행으로 안전하게 삭제)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- 로그인된 사용자만 본인 계정 삭제 RPC 호출 가능
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
