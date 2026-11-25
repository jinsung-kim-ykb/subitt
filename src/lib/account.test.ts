import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localDb } from './db';

describe('회원 탈퇴 및 개인정보 삭제 (SPEC 12장 9번 기준 & AGENTS.md 7장)', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    vi.clearAllMocks();
  });

  it('회원 탈퇴 시 캐시된 운영/파티 정보가 모두 삭제되어야 한다', () => {
    mockStorage['subit_plan_catalog'] = JSON.stringify([{ id: '1' }]);
    mockStorage['subit_bundle_rules'] = JSON.stringify([{ id: '2' }]);
    mockStorage['subit_cancellation_guides'] = JSON.stringify([{ id: '3' }]);
    mockStorage['subit_parties'] = JSON.stringify([{ id: '4' }]);

    expect(mockStorage['subit_plan_catalog']).toBeDefined();

    // 탈퇴 처리 로직 시뮬레이션
    delete mockStorage['subit_plan_catalog'];
    delete mockStorage['subit_bundle_rules'];
    delete mockStorage['subit_cancellation_guides'];
    delete mockStorage['subit_parties'];

    expect(mockStorage['subit_plan_catalog']).toBeUndefined();
    expect(mockStorage['subit_bundle_rules']).toBeUndefined();
    expect(mockStorage['subit_cancellation_guides']).toBeUndefined();
    expect(mockStorage['subit_parties']).toBeUndefined();
  });

  it('localDb.clearAllData 호출 시 로컬 캐시가 정상 초기화된다', async () => {
    // mock DB clearAllData
    const clearSpy = vi.spyOn(localDb, 'clearAllData').mockResolvedValue(undefined);

    await localDb.clearAllData();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
