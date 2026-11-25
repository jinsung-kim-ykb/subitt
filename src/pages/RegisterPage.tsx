import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../context/SubscriptionContext';
import { Category, BillingCycle, ServiceCatalogItem } from '../types';
import { CATEGORIES } from '../lib/constants';
import { ArrowLeft, Check, Sparkles, MessageSquare, Image as ImageIcon, Edit3, Upload, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { parseMultiSms } from '../lib/sms';
import { extractWithAi, ExtractedCandidate } from '../lib/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { catalog } = useSubscriptions();

  // 3대 탭: 'sms' (문자), 'capture' (캡처), 'manual' (직접 입력)
  const [activeTab, setActiveTab] = useState<'sms' | 'capture' | 'manual'>('sms');

  // --- 1. 문자 붙여넣기 상태 ---
  const [smsText, setSmsText] = useState('');
  const [isProcessingSms, setIsProcessingSms] = useState(false);

  // --- 2. 캡처 올리기 상태 ---
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [captureTypeHint, setCaptureTypeHint] = useState<'app_store' | 'card_history' | 'receipt_email' | 'trial_screen'>('app_store');
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);

  // --- 3. 직접 입력 폼 상태 ---
  const [manualSubTab, setManualSubTab] = useState<'catalog' | 'form'>('catalog');
  const [serviceName, setServiceName] = useState('');
  const [planName, setPlanName] = useState('');
  const [category, setCategory] = useState<Category>('기타');
  const [amount, setAmount] = useState<number>(0);
  const [currency] = useState('KRW');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(
    format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [paymentMethodMemo, setPaymentMethodMemo] = useState('');
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [postTrialAmount, setPostTrialAmount] = useState<number>(0);

  // 카탈로그 항목 선택 시
  const handleSelectCatalogItem = (item: ServiceCatalogItem) => {
    setServiceName(item.name);
    setCategory(item.category);
    setPlanName(item.defaultPlanName);
    setAmount(item.defaultAmount);
    setBillingCycle(item.defaultCycle);
    setManualSubTab('form');
  };

  // 1. 문자 파싱 처리 (A1)
  const handleProcessSms = async () => {
    if (!smsText.trim()) {
      alert('결제 문자를 붙여넣어 주세요.');
      return;
    }

    setIsProcessingSms(true);
    try {
      // 1-1. 기기 내 정규식 1차 파싱 (SPEC 6장 1번)
      const parsedItems = parseMultiSms(smsText, catalog);

      if (parsedItems.length > 0) {
        // 정규식으로 1개 이상 파싱 성공
        const candidates: ExtractedCandidate[] = parsedItems.map(p => ({
          serviceName: p.matchedServiceName || p.merchantName,
          planName: p.planName,
          category: p.category || '기타',
          amount: p.amount,
          currency: p.currency,
          billingCycle: p.billingCycle || 'monthly',
          nextBillingDate: p.paidAt,
          isFreeTrial: false,
          confidence: p.confidence,
          isCancellation: p.isCancellation
        }));

        navigate('/confirm', { state: { candidates, source: 'sms' } });
      } else {
        // 1-2. 정규식 매칭 실패 시 개인정보 가림 후 AI API 호출 (SPEC 6장 2번)
        const aiCandidates = await extractWithAi({ rawText: smsText });
        navigate('/confirm', { state: { candidates: aiCandidates, source: 'ai_sms' } });
      }
    } catch (e) {
      alert('문자 분석 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsProcessingSms(false);
    }
  };

  // 2. 캡처 이미지 선택 및 변환 (A2)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = await Promise.all(
      files.map(file => {
        return new Promise<{ file: File; preview: string; base64: string }>(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              file,
              preview: URL.createObjectURL(file),
              base64: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const handleProcessCapture = async () => {
    if (selectedImages.length === 0) {
      alert('분석할 캡처 이미지를 1장 이상 선택해 주세요.');
      return;
    }

    setIsProcessingCapture(true);
    try {
      const base64List = selectedImages.map(img => img.base64);
      const candidates = await extractWithAi({
        imageBase64List: base64List,
        captureTypeHint
      });

      navigate('/confirm', { state: { candidates, source: 'capture' } });
    } catch (e) {
      alert('캡처 인식 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsProcessingCapture(false);
    }
  };

  // 3. 직접 입력 확정
  const handleProceedManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      alert('서비스 이름을 입력해 주세요.');
      return;
    }

    const chosenDate = isFreeTrial ? trialEndDate : nextBillingDate;
    let extractedBillingDay = 1;
    if (chosenDate) {
      const parts = chosenDate.split('-');
      if (parts.length === 3) {
        extractedBillingDay = parseInt(parts[2], 10) || 1;
      }
    }

    const candidate: ExtractedCandidate = {
      serviceName,
      planName,
      category,
      amount: Number(amount),
      currency,
      billingCycle,
      billingDay: extractedBillingDay,
      nextBillingDate: chosenDate,
      paymentMethodMemo,
      isFreeTrial,
      trialEndDate: isFreeTrial ? trialEndDate : undefined,
      postTrialAmount: isFreeTrial ? Number(postTrialAmount) : undefined,
      confidence: 1.0
    };

    navigate('/confirm', { state: { candidates: [candidate], source: 'manual' } });
  };

  return (
    <div className="p-5">
      {/* 헤더 */}
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">구독 등록</h1>
      </div>

      {/* 상단 등록 방식 3분할 탭 */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('sms')}
          className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition ${
            activeTab === 'sms' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>문자 붙여넣기</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('capture')}
          className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition ${
            activeTab === 'capture' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>캡처 올리기</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition ${
            activeTab === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>직접 입력</span>
        </button>
      </div>

      {/* 탭 1: 문자 붙여넣기 (A1) */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-1">
            <span className="font-bold flex items-center space-x-1 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>카드 결제 문자를 그대로 붙여넣으세요</span>
            </span>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              여러 통의 문자를 한 번에 붙여넣어도 자동으로 분리합니다.<br />
              카드번호, 이름, 잔액은 <strong>기기 안에서 자동으로 가려진 뒤</strong> 안전하게 처리됩니다.
            </p>
          </div>

          <textarea
            rows={8}
            value={smsText}
            onChange={e => setSmsText(e.target.value)}
            placeholder={`예시:
[Web발신]
신한체크승인 홍*동(1234)
11/25 13:20 (일시불)
13,500원
넷플릭스
잔액 123,450원`}
            className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed resize-none"
          />

          <button
            onClick={handleProcessSms}
            disabled={isProcessingSms || !smsText.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 transition active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessingSms ? '문자 분석 중...' : '문자에서 구독 정보 추출하기'}</span>
          </button>
        </div>
      )}

      {/* 탭 2: 캡처 올리기 (A2) */}
      {activeTab === 'capture' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-1">
            <span className="font-bold flex items-center space-x-1 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>구독 화면 캡처를 여러 장 한 번에 올려보세요</span>
            </span>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              앱스토어 목록, 카드 앱 결제내역, 이메일 영수증, 무료체험 화면을 모두 지원합니다. 원본 이미지는 분석 후 서버에 일절 저장되지 않습니다.
            </p>
          </div>

          {/* 캡처 종류 힌트 선택 (SPEC 6장) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              캡처 종류 선택
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'app_store', label: '앱스토어·구글 구독' },
                { id: 'card_history', label: '카드 앱 결제 내역' },
                { id: 'receipt_email', label: '결제 영수증 이메일' },
                { id: 'trial_screen', label: '무료체험 가입 화면' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setCaptureTypeHint(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    captureTypeHint === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 이미지 파일 선택 박스 */}
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">이미지 파일 추가 (여러 장 가능)</span>
            <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG 파일 지원</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {/* 선택된 이미지 썸네일 미리보기 */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={img.preview} alt="캡처 미리보기" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleProcessCapture}
            disabled={isProcessingCapture || selectedImages.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 transition active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessingCapture ? '캡처 인식 중...' : `선택한 ${selectedImages.length}장 캡처 분석하기`}</span>
          </button>
        </div>
      )}

      {/* 탭 3: 직접 입력 (A3, A4, A5) */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setManualSubTab('catalog')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                manualSubTab === 'catalog' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              인기 카탈로그 선택
            </button>
            <button
              type="button"
              onClick={() => setManualSubTab('form')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                manualSubTab === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              직접 작성
            </button>
          </div>

          {manualSubTab === 'catalog' ? (
            <div className="grid grid-cols-2 gap-2.5">
              {catalog.map((item: ServiceCatalogItem) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectCatalogItem(item)}
                  className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name.slice(0, 1)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    월 {item.defaultAmount.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleProceedManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  서비스 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="예: 넷플릭스"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">분류</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        category === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">요금제 (선택)</label>
                <input
                  type="text"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="예: 스탠다드"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              {/* 무료체험 토글 (A5) */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">무료체험 중인가요?</span>
                  <p className="text-[11px] text-slate-500">종료일에 유료 결제되기 전 미리 알려드려요</p>
                </div>
                <input
                  type="checkbox"
                  checked={isFreeTrial}
                  onChange={e => setIsFreeTrial(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              {isFreeTrial ? (
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">체험 종료일</label>
                    <input
                      type="date"
                      required
                      value={trialEndDate}
                      onChange={e => setTrialEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">종료 후 청구액 (원)</label>
                    <input
                      type="number"
                      value={postTrialAmount || ''}
                      onChange={e => setPostTrialAmount(Number(e.target.value))}
                      placeholder="예: 9900"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">결제 주기</label>
                    <select
                      value={billingCycle}
                      onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200"
                    >
                      <option value="monthly">매월</option>
                      <option value="yearly">매년</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">금액 (원)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={amount || ''}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">다음 결제일</label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={e => setNextBillingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">결제 수단 메모</label>
                <input
                  type="text"
                  value={paymentMethodMemo}
                  onChange={e => setPaymentMethodMemo(e.target.value)}
                  placeholder="예: 현대카드 ZERO"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>등록 정보 확인하기</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
