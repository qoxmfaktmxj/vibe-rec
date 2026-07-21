# HireFlow 디자인 리뉴얼 브리프 — "차분한 확신 (Quiet Confidence)"

> 이 문서가 모든 구현의 단일 청사진이다. 모든 시각적 결정은 이 브리프로 소급 가능해야 한다.
> 컨텍스트: `.impeccable.md` / 평가: `docs/design-renewal/RUBRIC.md` / 규칙 상세: `DESIGN.md`(재작성본)

## 1. 컨셉

Cal.com의 절제된 근-단색 시스템을 HireFlow의 딥블루 유산 위에 이식한다.
**잉크가 행동하고, 블루는 신호한다.** 화면의 95%는 조용한 뉴트럴(블루 틴트), 행동은 잉크 CTA 하나,
브랜드 블루는 링크·활성·포커스·라이브 신호에만 나타난다. 페이지는 다크 네이비 푸터로 닫힌다.

차별점(기억에 남을 한 가지): **채용 파이프라인 자체가 UI의 주인공** — 히어로·공고 상세·지원자 대시보드·어드민 전부가
동일한 스텝퍼 시각 언어로 "지금 어디까지 왔나"를 답한다.

## 2. 컬러 토큰 (globals.css `:root` 교체값)

모든 뉴트럴은 브랜드 휴(hue 245°)로 미세 틴트한다. 순수 #fff/#000 금지(카드 표면 제외).

```css
/* Canvas & Surface */
--background: #F7F9FB;              /* 블루 틴트 근백색 캔버스 (Cal의 white 대응) */
--card: #FFFFFF;                    /* 카드만 순백 — 캔버스와의 깊이 대비 */
--surface: #FFFFFF;
--surface-container-lowest: #FFFFFF;
--surface-container-low: #F2F5F8;   /* 피처 카드·연회색 패널 (Cal #f5f5f5 대응) */
--surface-container: #EAEEF3;
--surface-container-high: #DEE4EB;
--surface-container-highest: #CDD6E0;

/* Ink (텍스트·행동) */
--on-surface: #121C28;              /* 잉크 — 블루 틴트 near-black */
--on-surface-variant: rgba(18, 28, 40, 0.62);
--outline: rgba(18, 28, 40, 0.28);
--outline-variant: rgba(18, 28, 40, 0.10);

/* Primary = 행동 잉크 (Cal의 #111 대응, 블루 틴트) */
--primary: #16283C;                 /* 주요 CTA 배경 */
--primary-hover: #22344A;           /* CTA hover — 잉크 한 단계 밝게 */
--primary-foreground: #FFFFFF;
--primary-container: #E3EDF6;       /* 연한 블루 컨테이너 (히어로 뱃지 등) */
--primary-fixed: #C9DEEF;

/* Brand accent = 신호 블루 (링크·활성·포커스) */
--brand: #0369A1;                   /* 기존 primary 승계 — 링크, 활성 nav, 인라인 강조 */
--brand-strong: #075985;            /* 링크 hover */
--secondary: #0EA5E9;
--ring: #0369A1;                    /* 포커스 링은 블루 유지(가시성) */

/* Dark footer (시스템 유일의 다크 표면) */
--surface-dark: #0C1826;
--surface-dark-elevated: #14243A;
--on-dark: #E9EFF6;
--on-dark-soft: #93A5B8;

/* Elevation (잉크 틴트 그림자 3단계) */
--shadow-1: 0 1px 2px rgba(18, 28, 40, 0.05);
--shadow-2: 0 2px 8px rgba(18, 28, 40, 0.07), 0 1px 2px rgba(18, 28, 40, 0.04);
--shadow-3: 0 16px 40px -16px rgba(18, 28, 40, 0.18);
```

유지: `--success/--destructive/--error-container/--chart-*`, 시맨틱 상태 색 예외(emerald=합격, rose=불합격, amber=대기, sky=진행).
`--sidebar-*`(어드민)는 `#0C4A6E` → `--surface-dark` 계열로 통일. 다크 테마 블록은 기존 유지하되 `--primary`만 `#E9EFF6`(잉크 반전) + `--brand: #7DD3FC`로 정렬.

**사용 규칙**
- filled CTA(`bg-primary`)는 밴드(섹션)당 1개. 보조 행동은 outline/ghost.
- `--brand`는 텍스트 링크, 활성 탭, 라이브 dot, 포커스 링에만. 대면적 배경 사용 금지.
- 배지 pastel은 상태 시맨틱 색만. 장식용 임의 색 금지.

## 3. 타이포그래피

| 슬롯 | 폰트 | 로딩 | 역할 |
|------|------|------|------|
| `--font-body` | **Wanted Sans Variable** | npm `wanted-sans` → `fonts/webfonts/variable/split/WantedSansVariable.css` import (한글 동적 서브셋, wght 400–1000) | 본문·UI·한글 전부 |
| `--font-headline` | **Sora** (라틴) → Wanted Sans fallback | 기존 next/font/google 유지 | 라틴 디스플레이·로고·숫자 헤드라인. 한글 글리프는 자동으로 Wanted Sans로 |
| `--font-mono` | **Spline Sans Mono** | next/font/google (`Spline_Sans_Mono`, 400/500) | 메타 라벨, 카운터, 날짜, D-day, 테이블 숫자 |

globals.css 폰트 스택: `font-family: var(--font-headline), "Wanted Sans Variable", sans-serif;` (헤드라인) / `var(--font-body), "Wanted Sans Variable", sans-serif` 형태가 아니라 **body 스택 자체를 `"Wanted Sans Variable", var(--font-body), sans-serif`로** — 한글·라틴 모두 Wanted Sans가 1순위, Sora는 헤드라인 전용. IBM Plex Mono는 제거.

**타입 스케일 (헤드라인 트래킹 한글 상한 -0.02em로 완화)**

| 단계 | 크기/행간 | 용도 |
|------|-----------|------|
| display | `clamp(2.5rem, 5vw, 4rem)` / 1.12 / -0.02em / w700 | 히어로 (기존 72px에서 축소 — 한글 밀도 기준) |
| h1 | 2rem / 1.25 / -0.02em / w700 | 페이지 제목 |
| h2 | 1.5rem / 1.3 / -0.015em / w600 | 섹션 제목 |
| h3 | 1.125rem / 1.4 / -0.01em / w600 | 카드 제목 |
| body | 0.9375rem(15px) / 1.7 / -0.005em / w400 | 본문 (한글 행간 확보) |
| caption | 0.8125rem(13px) / 1.5 / 0 / w400 | 보조 |
| meta | 11px mono / 1.2 / +0.14em / uppercase | 라벨·카운터 (mono) |

**한글 규칙 (base layer에 적용)**
- `h1–h6, p, li, dt, dd { word-break: keep-all; }` + `h1–h3 { text-wrap: balance; }`
- 테이블 숫자 셀: `font-variant-numeric: tabular-nums` 또는 mono
- 밑줄 링크: `text-underline-offset: 3px`

## 4. 형태·공간

- Radius 위계(Cal): 버튼·입력 `rounded-lg`(8px) / 카드 `rounded-xl`(≈11px) / 히어로 제품 프레임 `rounded-xl` / 뱃지·nav pill `rounded-full`. `rounded-2xl+` 금지 유지.
- 섹션 리듬: 공개 사이트 밴드 간 `py-20 md:py-24`(96px 급), 밴드 내부 요소 `gap-10/12`. 균일 p-8 반복 금지 — 그룹 내 tight(8–12px), 그룹 간 generous(32–48px).
- 히어로는 비대칭 12-col: 텍스트 7 / 제품 UI 프래그먼트 5. 나머지 섹션 좌측 정렬.
- 카드 중첩 금지. 정보 계층은 배경 틴트(`surface-container-low`)와 hairline으로.

## 5. 시그니처 컴포넌트 (신규/개편)

1. **`RecruitmentStepper`** (`features/recruitment/shared/`) — 채용 단계 시각화. 원형 노드(완료=잉크 채움+체크, 현재=브랜드 블루 ring+pulse dot, 예정=hairline) + 커넥터 라인. 수평(카드)·수직(상세) 두 방향. 공고 상세, /me 카드, 어드민 상세에서 재사용.
2. **다크 푸터** (`features/recruitment/layout/PublicSiteFooter.tsx`) — `--surface-dark` 배경, 회사 정보·법적 링크·문의·채용 문서 링크 4열 → 모바일 1열. 시스템 유일의 다크 표면.
3. **Nav pill group** — `PublicSiteHeader` 네비를 `surface-container-low` pill 래퍼 + 활성 항목 카드 배경으로.
4. **히어로 제품 프래그먼트** — 실제 어드민 파이프라인/지원 현황 UI의 정적 미니어처(실 컴포넌트 스타일 재사용, 데모 데이터). 장식 일러스트 아님.
5. **D-day 메타** — 공고 카드 mono 카운터. 마감 ≤7일: `text-destructive` + 잉크 강조, 상시채용: 브랜드 블루 라이브 dot.
6. **상태 뱃지 v2** — `getApplicationStatusClassName` 계열: 배경 100단계 + ring + 텍스트 800~900 유지, `min-w` 정렬, dot 아이콘 선행. 시맨틱 색 체계는 유지.

## 6. Phase별 범위

- **P1 토큰·타이포**: globals.css 전면(§2·3·4 토큰), layout.tsx 폰트, badge 함수 강화, button.tsx variant 정렬, favicon 색 동기화(§2 잉크). 기존 `hero-gradient`/`stat-card` 유틸 제거·교체.
- **P2 공개 사이트**: 홈(비대칭 히어로+신뢰 신호+제품 프래그먼트), 공고 카드 위계(D-day), 공고 상세(스텝퍼), 다크 푸터, nav pill, 스크롤 리빌 1회.
- **P3 /me**: 지원 카드에 수평 스텝퍼, 다음 액션 버튼 상단 노출, 세션 카드 정돈.
- **P4 어드민**: 대시보드 통계에 진행률 바·미니 추이(기존 API 데이터 범위 내), 테이블 sticky header·행 밀도·hover, RailNav 툴팁. ⚠ 메인 트리 WIP과 충돌 최소화 — 공유 컴포넌트·토큰 레벨 위주, `applicants/page.tsx` 대수술 금지.
- **P5 검증**: RUBRIC 전 항목 최종 채점, 반응형·대비 검사, DESIGN.md 마감.

## 7. 금지 (절대)

gradient text(`background-clip: text`) / 3px+ 색상 side-border(`border-l-4` 류) / 보라·인디고 그라디언트 / 글래스모피즘 / bounce·elastic easing / 균일 아이콘 카드 3열 그리드 / 이모지 장식 / layout 속성 애니메이션(width/height/margin) / 히어로 중앙정렬 회귀.
