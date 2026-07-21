# 디자인 리뉴얼 평가 루브릭

> 모든 Phase는 이 루브릭으로 채점된다. **통과 기준: 평균 9.0/10 이상 AND 모든 항목 8점 이상.**
> 채점자: 오케스트레이터(Fable). 각 점수에는 반드시 검증 근거(프리뷰 스냅샷·inspect 값·명령 출력)를 남긴다.
> 미달 시: 구체적 수정 지시 → 재작업 → 전체 재채점. 통과 전에는 해당 Phase를 커밋하지 않는다.

## 채점 항목 (각 0–10)

| # | 항목 | 측정 방법 | 9점 이상의 조건 |
|---|------|-----------|----------------|
| 1 | **토큰 순도** | `/design-check` + grep 검사 | 하드코딩 hex/`bg-white`/`text-gray-*` 0건. 시맨틱 상태 색(emerald/rose/amber/sky) 예외만 허용. 새 값은 반드시 토큰으로 등록 |
| 2 | **한글 타이포그래피** | preview_inspect로 실제 렌더 font-family 확인 + 스크린샷 | 한글이 Wanted Sans로 렌더(시스템 폰트 fallback 아님). 본문 행간 ≥1.65, 헤드라인 한글 트래킹 ≥ -0.02em, 제목·문단 `word-break: keep-all`, 헤딩 `text-wrap: balance` |
| 3 | **타입 위계·리듬** | 스크린샷 + 스케일 검토 | 인접 스케일 대비 ≥1.25, 페이지당 크기 단계 ≤6, 메타/라벨은 mono 체계 일관, 위계가 3초 안에 읽힘 |
| 4 | **색·대비 (WCAG AA)** | preview_inspect 색상값 대비 계산 | 본문 4.5:1, 대형 텍스트 3:1 이상. 60-30-10 준수 — 블루 액센트가 화면의 10% 이하, filled CTA 밴드당 1개 |
| 5 | **컴포넌트 상태 완전성** | preview_click/hover + 코드 리뷰 | 인터랙티브 요소 전부 hover/focus-visible/active/disabled 정의. 목록형 UI는 empty state가 디자인됨(교육적 카피 포함). 포커스 링 항상 가시 |
| 6 | **레이아웃·공간 리듬** | 스크린샷 검토 | 섹션 간격에 위계(균일 padding 반복 금지), 카드 중첩 없음, 비대칭 구성 ≥1곳(히어로 등), 본문 측정폭 ≤75ch, 좌측 정렬 기본 |
| 7 | **반응형** | preview_resize 375/768/1280 | 모바일에서 기능 손실 없음(숨김이 아니라 재배치), 터치 타깃 ≥44px, 가로 스크롤 0, 어드민은 1024px+ 가드 유지 |
| 8 | **모션·인터랙션** | preview + 코드 리뷰 | transform/opacity만 애니메이션, `prefers-reduced-motion` 전부 대응, 입장 모션은 페이지당 1회 오케스트레이션, bounce/elastic 금지 |
| 9 | **브리프 충실도·독창성 (AI-slop 테스트)** | BRIEF.md 대조 + 금지 패턴 검사 | Cal 원칙(잉크 CTA, 다크 푸터, 제품 UI 임베드, 절제 블루) 구현. 금지: 보라 그라디언트, gradient text, 3px+ 색상 side-border, 균일 아이콘 카드 그리드, 글래스모피즘. "AI가 만들었다"고 바로 믿기지 않을 것 |
| 10 | **엔지니어링 건강** | `npx tsc --noEmit` + `npm run lint` + `npm run build` | 3개 모두 0 에러. feature-slice import 방향 준수, 서버/클라이언트 컴포넌트 경계 유지, DTO 타입 변경 없음(프레젠테이션 전용) |

## 채점 기록 양식

```
## Phase N 채점 (시도 M)
| 항목 | 점수 | 근거 |
|---|---|---|
| 1. 토큰 순도 | 9 | design-check 통과, grep 0건 |
| ... | ... | ... |
평균: X.X → PASS / FAIL
FAIL 시 수정 지시: ...
```

채점 기록은 `docs/design-renewal/SCORECARD.md`에 누적한다.
