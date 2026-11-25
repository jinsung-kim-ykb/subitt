import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-6 px-4 selection:bg-brand-100 selection:text-brand-700">
      <div className="w-full max-w-[430px] bg-white rounded-2xl shadow p-6 space-y-6 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h1 className="text-lg font-bold text-slate-900">개인정보 처리방침 (초안)</h1>
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800">닫기 ✕</Link>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          SUBIT(이하 '서비스')은 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하며, 개인정보를 안전하게 관리하고 있습니다. 본 방침은 서비스 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있는지 안내합니다.
        </p>

        {/* 1. 수집 항목 및 목적 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">1. 개인정보 수집 항목 및 이용 목적</h2>
          <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-700">① 회원가입 및 계정 관리:</span>
              <p className="text-slate-600 mt-0.5">• 수집항목: 이메일 주소, 소셜 로그인 식별자(카카오/구글)</p>
              <p className="text-slate-600">• 목적: 본인 식별, 로그인 유지, 기기간 구독 데이터 동기화</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">② 구독 관리 및 알림:</span>
              <p className="text-slate-600 mt-0.5">• 수집항목: 구독 서비스명, 결제 금액, 결제 주기, 결제 예정일, 웹 푸시 엔드포인트 토큰</p>
              <p className="text-slate-600">• 목적: 구독료 통계, 결제일/무료체험 종료 사전 알림 발송</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">③ 파티 정산 (선택):</span>
              <p className="text-slate-600 mt-0.5">• 수집항목: 파티원 이름(별칭), 분담 금액, 정산 계좌번호 또는 간편송금 링크</p>
              <p className="text-slate-600">• 목적: 분담액 계산 및 파티원 간 정산 현황 공유</p>
            </div>
          </div>
        </section>

        {/* 2. 원문 미저장 및 가림 처리 원칙 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">2. 결제 문자 및 캡처 이미지 처리 원칙</h2>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-1.5 text-emerald-900">
            <p className="font-semibold">🛡️ 철저한 개인정보 비저장 및 기기 내 가림(마스킹) 처리</p>
            <p className="text-emerald-800">• 사용자가 등록을 위해 붙여넣은 <strong>결제 문자 원문</strong> 및 <strong>캡처 이미지 원본</strong>은 서비스의 데이터베이스, 파일 저장소, 서버 로그 어디에도 저장되지 않으며 메모리 추출 즉시 파기됩니다.</p>
            <p className="text-emerald-800">• AI 모델로 텍스트를 전송하기 전 기기(브라우저) 내부에서 <strong>카드번호, 사용자 성명, 계좌 잔액</strong>을 정규식으로 마스킹(***) 처리하여 전송합니다.</p>
          </div>
        </section>

        {/* 3. AI API 외부 전송 및 국외 이전 (사용자 기입 빈칸) */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">3. 개인정보의 국외 이전 및 AI 위탁 (초안)</h2>
          <p className="text-xs text-slate-600">
            구독 정보 자동 인식을 위해 다음과 같이 인공지능 API 제공 업체에 최소한의 가림 처리된 텍스트 및 이미지를 전송할 수 있습니다. (운영자 최종 확인 필요)
          </p>
          <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-2 bg-slate-50">
            <p><strong>• 이전받는 자(업체명):</strong> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</p>
            <p><strong>• 이전되는 국가:</strong> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</p>
            <p><strong>• 이전 항목:</strong> 개인정보가 마스킹된 결제 문자 텍스트 또는 구독 화면 캡처 이미지</p>
            <p><strong>• 이용 목적:</strong> 구독 서비스명, 금액, 결제일 광학 추출 및 구조화</p>
            <p><strong>• 보유 및 이용 기간:</strong> AI 모델 추론 완료 즉시 폐기 (학습 및 제품 개선에 활용되지 않는 조건 사용)</p>
          </div>
        </section>

        {/* 4. 보관 및 파기 기간 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">4. 개인정보의 보유 및 파기</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            원칙적으로 정보주체의 <strong>회원 탈퇴 시 모든 개인정보와 구독 데이터는 서버에서 즉시 영구 삭제(Cascade Delete)</strong>됩니다. 관계 법령에 의해 보존이 필요한 경우 해당 법령이 정한 기한 동안 보관됩니다.
          </p>
        </section>

        {/* 5. 정보주체의 권리 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">5. 정보주체의 권리 및 행사 방법</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 서비스 탈퇴를 통해 개인정보의 파기를 요청할 수 있습니다.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <Link
            to="/"
            className="w-full text-center py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};
