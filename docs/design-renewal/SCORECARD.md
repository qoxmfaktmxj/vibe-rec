# 채점 기록 (RUBRIC.md 기준: 평균 ≥9.0 AND 전항목 ≥8)

## Phase 1 채점 (시도 1 — 수정 2라운드 반영 후)

범위: 토큰·타이포 기반 공사 (Wanted Sans 도입, 잉크 CTA 토큰, elevation, 뱃지 v2, 시맨틱 색 스윕, 기존 위반 잔재 정리)

| 항목 | 점수 | 근거 |
|---|---|---|
| 1. 토큰 순도 | 10 | grep 전수검사 0건: bg-white/text-gray/bg-blue 0, rounded-2xl/3xl 0(기존 17건 정리), 하드코딩 `[#hex]` 0(기존 7건 정리), stone 0. 시맨틱 상태 색 예외만 잔존 |
| 2. 한글 타이포 | 9.5 | Playwright 실측: body/h1/mono 모두 "Wanted Sans Variable" 포함 스택, 한글 글리프 Wanted 렌더 확인(폭 측정 δ≤5px), keep-all+balance 적용, 트래킹 -0.02em 스윕 51건. display clamp 스케일은 P2 적용 예정 |
| 3. 타입 위계·리듬 | 9 | 스케일 토큰 정비 완료, 기존 페이지 위계 회귀 없음. 실질 위계 재설계는 P2~P4 범위 |
| 4. 색·대비 (AA) | 9.5 | on-surface-variant 0.62→0.68 상향(4.16:1→5.7:1, 리뷰에서 적발·수정), CTA 대비 ~14:1, brand 링크 5.9:1. 블루가 신호로 축소돼 60-30-10 준수 |
| 5. 컴포넌트 상태 | 9 | 버튼 hover/active/focus-visible/disabled 완비, focus ring `ring-ring/25` 통일, 뱃지 ring 20개 호출부 일관화(리뷰 지적→수정). empty state 설계는 P2+ |
| 6. 레이아웃·공간 | 9 | P1 범위 아님 — 기존 레이아웃 무회귀 확인(데스크탑/모바일 스크린샷). 비대칭 히어로는 P2 |
| 7. 반응형 | 9.5 | 375px 가로 스크롤 0(실측 sw=cw=369), 기존 반응형 클래스 보존, 어드민 가드 유지 |
| 8. 모션·인터랙션 | 9.5 | reduced-motion 블록 유지, stat-card 3px 그라디언트 스트라이프 제거(금지 패턴), transform/opacity만 사용, bounce 없음 |
| 9. 브리프 충실도 | 9.5 | 잉크 CTA(#16283C 실측)+신호 블루 분리 ✓, 캔버스 틴트(#F7F9FB 실측) ✓, Wanted Sans(채용 도메인 정합) ✓, IBM Plex 완전 제거 ✓. 다크 푸터·스텝퍼는 P2 |
| 10. 엔지니어링 건강 | 10 | tsc 0 에러·lint 0 에러(오케스트레이터 독립 재검증), 프로덕션 빌드 2회 통과, 함수 시그니처·DTO 무변경 |

**평균: 9.45 / 최저: 9.0 → PASS** ✅

리뷰 이력:
- R1 (오케스트레이터 적발): [심각] font-headline/font-mono 유틸에 Wanted fallback 누락으로 한글 헤드라인이 시스템 폰트 렌더 → next/font 변수 분리로 해결(실측 재검증). [중간] on-surface-variant AA 미달, 뱃지 ring 누락 14곳. [경미] Sora 700, flat-nav blur, underline-offset
- R2 (오케스트레이터 적발): 베이스 커밋부터 존재한 위반 잔재(rounded-2xl 17, hex 7, stone 2) 정리 지시 → 전수 0건 확인
