# 개발 계획서 (PLAN)

## 2단계: 등록 자동화 (현재 단계)
- [x] 카드사별 문자 파싱 정규식 분리 (신한, KB국민, 현대, 삼성, 일반)
- [x] 개인정보 가림 처리 순수 함수 및 단위 테스트 (카드번호, 성명, 잔액)
- [x] Supabase Edge Function AI 교체 구조 (Mock, Claude Haiku 5.5, GPT-5 mini, Gemini 3.5 Flash-Lite)
- [x] 캡처 올리기 및 다중 캡처 지원
- [x] 등록 확인 화면 S04 (다중 건 일괄 확정, 낮은 확신도 하이라이트)
- [x] 무료체험(A5) 및 외화(A6 옵션 A) 처리
- [x] 취소 문자 처리
- [x] 제공자 비교 스크립트 (compare-providers.ts)
