# SUBIT (구독 관리 웹앱) 운영 안내서

20대 대학생 및 사회초년생의 불필요한 고정 지출을 줄여주는 모바일 퍼스트 PWA 구독 관리 및 구독료 방어 웹앱입니다.

---

## 1. 프로젝트 실행 및 개발 명령어

- **의존성 설치**: `npm install`
- **로컬 개발 서버 실행**: `npm run dev` (기본 포트: `http://localhost:5173`)
- **단위 테스트 실행**: `npm test` (Vitest 기반 전체 41개 테스트)
- **프로덕션 빌드**: `npm run build` (`dist/` 번들 및 PWA 서비스 워커 생성)
- **AI 제공자 벤치마크 비교**: `npm run compare:providers`

---

## 2. 요금표 · 결합 규칙 · 해지 가이드 갱신 방법

구독료 절감 제안(SPEC 7장)과 해지 가이드(F1)는 최신성이 가장 중요합니다. (기본 갱신일 기준: 45일)

### A. 운영자 웹 관리 화면에서 수정 (권장)
1. 브라우저에서 `http://localhost:5173/admin`으로 접속합니다. (초기 관리자 계정: `admin@subit.kr`)
2. 상단 탭에서 **[요금표 관리]**, **[통신사 결합 규칙]**, **[해지 가이드]** 중 원하는 탭을 선택합니다.
3. **요금표 수정 시 주의사항**:
   - 기존 요금보다 금액을 올려서 저장하면, 해당 요금제를 구독 중인 모든 사용자에게 **요금 인상 알림(`price_increase`)**이 자동으로 생성되어 알림함에 전달됩니다.
   - 수정 즉시 `updatedAt`이 오늘 날짜로 자동 갱신됩니다.
4. **결합 규칙 & 해지 가이드**:
   - 결합 조건, 할인 금액, 공식 신청 링크, 단계별 해지 경로(웹 직접결제, App Store, Google Play)를 실시간 추가/삭제할 수 있습니다.

### B. Supabase 데이터베이스 직접 수정
- `plan_catalog`: 서비스별 정가 및 요금제 정보 (`updated_at` 컬럼 필수 갱신)
- `bundle_rules`: 통신사/카드사 결합 할인 규칙
- `20261125000001_phase3_phase4_schema.sql` 마이그레이션 적용 필요.

---

## 3. AI 제공자 교체 방법

본 서비스는 특정 AI API에 종속되지 않도록 **어댑터 패턴(SPEC 5장)**으로 설계되었습니다. 브라우저 코드에는 어떠한 API 키도 포함되지 않으며, Supabase Edge Function 환경 변수 하나로 즉시 교체됩니다.

### A. 제공자 전환 명령어 (Supabase CLI)
```bash
# 1. Gemini (기본 추천 / 비용 최적화)
supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY="your-gemini-key"

# 2. Claude (Anthropic Haiku 5.5)
supabase secrets set AI_PROVIDER=claude ANTHROPIC_API_KEY="your-anthropic-key"

# 3. OpenAI (GPT-5 mini)
supabase secrets set AI_PROVIDER=openai OPENAI_API_KEY="your-openai-key"

# 4. Mock (API 키 없는 로컬 테스트용)
supabase secrets set AI_PROVIDER=mock
```

### B. 제공자별 단가 및 정확도 비교
샘플 캡처 및 결제 문자에 대해 항목별 정답률과 100만 토큰당 비용을 비교하려면 아래 스크립트를 실행합니다.
```bash
npm run compare:providers
```

---

## 4. 알림 발송 함수 (Scheduled Notifications) 실행 방법

SPEC 8장에 따라 매일 **한국 시각 오전 9시 (UTC 00:00)**에 당일 결제일(D-3, D-1) 및 무료체험 종료(D-3, D-1) 대상자에게 알림을 생성하고 푸시를 발송합니다.

### A. Supabase pg_cron 자동 실행 설정
Supabase SQL Editor에서 아래 cron 작업을 등록합니다:
```sql
-- 매일 UTC 00:00 (한국 시간 오전 9시) 자동 실행
SELECT cron.schedule(
  'subit-daily-morning-notification',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<PROJECT-REF>.supabase.co/functions/v1/send-scheduled-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
      body := '{"targetDate": "today"}'::jsonb
    ) as request_id;
  $$
);
```

### B. 수동 즉시 실행 및 테스트 (cURL)
원하는 날짜를 기준으로 알림 대상 추출 및 발송 로직을 즉시 테스트할 수 있습니다:
```bash
curl -X POST https://<PROJECT-REF>.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"targetDate": "2026-11-26"}'
```

---

## 5. 데이터 보안 및 규정 준수

1. **개인정보 비저장**: 사용자가 붙여넣은 카드 결제 문자 원문과 결제 내역 캡처 이미지는 DB, 파일 저장소, 로그 어디에도 저장되지 않고 메모리에서 추출 즉시 폐기됩니다.
2. **기기 내 가림(마스킹) 처리**: AI API 전송 전 기기(브라우저)에서 정규식으로 카드번호, 성명, 잔액을 사전 마스킹(***)합니다.
3. **초대 링크 격리**: 파티 정산 초대 링크(`/party/invite/:token`)는 비로그인 사용자에게 해당 파티의 서비스명, 본인 분담액, 납부 상태만 노출하며 파티장의 타 구독 및 개인정보는 차단됩니다.
4. **개인정보 처리방침 초안**: 서비스 내 `/privacy` 경로에서 확인 가능합니다.
