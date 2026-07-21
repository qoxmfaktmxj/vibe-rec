# DESIGN.md — HireFlow 디자인 시스템 v2 "차분한 확신"

> 새 컴포넌트를 만들기 전에 이 파일을 먼저 읽으세요. shadcn 기본값(Inter, 큰 radius)을 그대로 쓰지 마세요.
> 방향·근거는 `docs/design-renewal/BRIEF.md`, 품질 기준은 `docs/design-renewal/RUBRIC.md` 참조.
> 마지막 업데이트: 2026-07-12 (Cal.com 레퍼런스 기반 리뉴얼)

---

## 0. 스펙 (기계 판독용)

```yaml
concept: "잉크가 행동하고, 블루는 신호한다 — near-monochrome 신뢰 시스템 + 채용 파이프라인 시각화"

colors:
  background: "#F7F9FB"        # 캔버스 (블루 틴트 근백색)
  card: "#FFFFFF"              # 카드 표면 (유일한 순백)
  surface-container-low: "#F2F5F8"   # 연회색 피처 카드·패널
  surface-container: "#EAEEF3"
  surface-container-high: "#DEE4EB"
  surface-container-highest: "#CDD6E0"
  on-surface: "#121C28"        # 잉크 텍스트
  on-surface-variant: "rgba(18,28,40,0.62)"
  outline: "rgba(18,28,40,0.28)"
  outline-variant: "rgba(18,28,40,0.10)"
  primary: "#16283C"           # 행동 잉크 — filled CTA 전용
  primary-hover: "#22344A"
  primary-foreground: "#FFFFFF"
  primary-container: "#E3EDF6"
  brand: "#0369A1"             # 신호 블루 — 링크·활성·포커스·라이브 dot
  brand-strong: "#075985"
  secondary: "#0EA5E9"
  ring: "#0369A1"
  surface-dark: "#0C1826"      # 다크 푸터 (시스템 유일의 다크 표면)
  surface-dark-elevated: "#14243A"
  on-dark: "#E9EFF6"
  on-dark-soft: "#93A5B8"
  success: "#16A34A"
  destructive: "#DC2626"

typography:
  display:  { size: "clamp(2.5rem,5vw,4rem)", weight: 700, lineHeight: 1.12, tracking: "-0.02em", family: headline }
  h1:       { size: "2rem",      weight: 700, lineHeight: 1.25, tracking: "-0.02em",  family: headline }
  h2:       { size: "1.5rem",    weight: 600, lineHeight: 1.3,  tracking: "-0.015em", family: headline }
  h3:       { size: "1.125rem",  weight: 600, lineHeight: 1.4,  tracking: "-0.01em",  family: headline }
  body:     { size: "0.9375rem", weight: 400, lineHeight: 1.7,  tracking: "-0.005em", family: body }
  caption:  { size: "0.8125rem", weight: 400, lineHeight: 1.5,  tracking: "0",        family: body }
  meta:     { size: "11px",      weight: 500, lineHeight: 1.2,  tracking: "0.14em",   family: mono, transform: uppercase }

fonts:
  body: "Wanted Sans Variable"     # npm wanted-sans, 한글 동적 서브셋, 본문·UI 전부
  headline: "Sora"                 # 라틴 디스플레이·로고 전용, 한글 글리프는 Wanted Sans fallback
  mono: "Spline Sans Mono"         # 메타 라벨·카운터·날짜·테이블 숫자

rounded:
  button: "rounded-lg"      # 8px — 버튼·입력
  card: "rounded-xl"        # ≈11px — 카드·패널·모달
  badge: "rounded-full"     # 뱃지·nav pill·아바타
  banned: ["rounded-2xl", "rounded-3xl"]

elevation:
  shadow-1: "0 1px 2px rgba(18,28,40,0.05)"                                  # 정지 카드
  shadow-2: "0 2px 8px rgba(18,28,40,0.07), 0 1px 2px rgba(18,28,40,0.04)"   # hover·드롭다운
  shadow-3: "0 16px 40px -16px rgba(18,28,40,0.18)"                          # 모달·히어로 프레임

spacing:
  section: "py-20 md:py-24"        # 공개 사이트 밴드 간
  page-x: "px-6 md:px-16"
  card: "p-6"  # 대형 p-8
  group-tight: "gap-2~3"           # 라벨↔값
  group-loose: "gap-10~12"         # 그룹 간
```

---

## 1. Overview

HireFlow는 공개 채용 사이트(마케팅)와 어드민 도구(앱 UI)의 하이브리드다. 디자인 언어는 Cal.com을 주 레퍼런스로
한 **근-단색(near-monochrome) 신뢰 시스템**: 블루 틴트 캔버스(`--background`) 위에 순백 카드, 행동은 잉크
CTA(`--primary` #16283C) 하나, 브랜드 블루(`--brand` #0369A1)는 링크·활성 상태·포커스 링·라이브 신호에만 나타난다.
모든 공개 페이지는 다크 네이비 푸터(`--surface-dark`)로 닫힌다 — 시스템에서 유일한 다크 표면.

시그니처는 **채용 파이프라인 시각화**: `RecruitmentStepper`가 공고 상세·지원자 대시보드·어드민에서 동일한
시각 언어(완료=잉크, 현재=블루, 예정=hairline)로 진행 상태를 답한다. 마케팅 일러스트 대신 실제 제품 UI의
미니어처를 카드에 임베드한다(Cal 방식).

## 2. 색상 사용 규칙

- **filled CTA는 밴드당 1개.** `bg-primary`(잉크)는 섹션에서 가장 중요한 행동 하나에만. 보조 행동은 outline/ghost.
- **`--brand` 블루는 신호 전용**: 텍스트 링크, 활성 탭/네비, 포커스 링, 라이브 dot, 인라인 강조. 대면적 배경 금지.
- **뉴트럴 위계**: `bg-background`(캔버스) → `bg-card`(순백 카드) → `bg-surface-container-low`(연회색 패널).
  중첩 카드 금지 — 카드 안 정보 그룹은 `surface-container-low` 틴트나 hairline(`border-outline-variant`)으로.
- **시맨틱 상태 색 예외 (유지)**: emerald=합격/제출, rose=불합격, amber=대기/임시저장, sky=진행중.
  상태 뱃지는 반드시 `shared/lib/recruitment.ts`의 `get*ClassName()` 사용.
- **금지**: `bg-white`(→`bg-card`), `text-gray-*`, `bg-blue-*` 직접 사용, hex 하드코딩, 보라/인디고 그라디언트.

## 3. 타이포그래피 — 한글 우선

**한글이 1급 시민이다.** 본문·UI 폰트는 Wanted Sans Variable(원티드랩, OFL). Sora는 라틴 디스플레이·로고·
숫자 헤드라인 전용이며 한글 글리프는 자동으로 Wanted Sans로 fallback된다. IBM Plex Mono는 폐기,
mono 슬롯은 Spline Sans Mono.

### 한글 조판 규칙 (base layer 적용, 위반 금지)
- 제목·문단 `word-break: keep-all` — 단어 중간 줄바꿈 금지
- `h1~h3`에 `text-wrap: balance`
- 본문 행간 ≥1.7 (`leading-7` 이상). 한글은 라틴보다 시각 밀도가 높다 — 좁은 행간 금지
- 헤드라인 트래킹 하한 **-0.02em** (기존 -0.04em은 한글에서 뭉개짐 — 회귀 금지)
- 본문 최대 측정폭 `max-w-[65ch]` 수준 유지
- 날짜·카운터·통계 숫자: `font-mono` 또는 `tabular-nums` — 열이 정렬되어야 한다

### 슬롯
| 클래스 | 폰트 | 사용처 |
|--------|------|--------|
| `font-headline` | Sora → Wanted Sans | 히어로, 페이지/섹션 제목, 로고 |
| `font-sans` (기본) | Wanted Sans Variable | 본문, UI 라벨, 폼 |
| `font-mono` | Spline Sans Mono | 메타 라벨(11px uppercase tracking-[0.14em]), D-day, 날짜, 테이블 숫자 |

## 4. Layout

- 공개 사이트 `max-w-7xl`, 지원 위저드 `max-w-4xl`, 인증 폼 `max-w-md`, 페이지 좌우 `px-6 md:px-16`
- 섹션 밴드 간 `py-20 md:py-24`. **균일 padding 반복 금지** — 관련 요소는 tight(8~12px), 그룹 간은 generous(40px+)
- 히어로는 비대칭 12-col 그리드(텍스트 7 : 제품 프래그먼트 5). 본문 섹션은 좌측 정렬 기본, 중앙 정렬은 히어로 배지 등 최소한만
- 어드민: `AdminRailNav` 레일 + 전폭 메인. 데스크탑 전용(`min-width: 1024px`, `AdminMobileGuard`)

## 5. Elevation & Depth

3단계 잉크-틴트 그림자만 사용한다. 임의 `shadow-[...]` 금지.

| 토큰 | 용도 |
|------|------|
| `--shadow-1` (`.elevation-1`) | 정지 상태 카드 |
| `--shadow-2` (`.elevation-2`) | hover 카드, 드롭다운, sticky 헤더 |
| `--shadow-3` (`.elevation-3`) | 모달, 히어로 제품 프레임 |

깊이는 그림자보다 **표면 틴트 대비**(캔버스↔카드)가 우선. 글래스모피즘(장식용 blur) 금지.

## 6. Components

### 버튼 (`components/ui/button.tsx` variants)
```tsx
// Primary (잉크 CTA — 밴드당 1개)
<Button>지원하기</Button>
// → bg-primary text-primary-foreground hover:bg-primary-hover, rounded-lg, h-11+ (44px 터치 타깃)

// Outline (보조)
<Button variant="outline">공고 보기</Button>
// → border-outline-variant bg-card hover:bg-surface-container-low text-on-surface

// Ghost / Link — 3차 행동, 텍스트 링크는 text-brand
```
press 상태: `active:translate-y-px`. hover 시 `-translate-y-0.5` 남용 금지(CTA 1곳 정도).

### 입력
```tsx
<input className="w-full rounded-lg border border-outline-variant bg-card px-3.5 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-brand focus:ring-2 focus:ring-ring/25" />
```
`outline-none`에는 반드시 `focus:ring-2` 동반 (WCAG 2.1 AA).

### 카드
```tsx
<div className="rounded-xl border border-outline-variant bg-card p-6 elevation-1">
```
인터랙티브 카드: `.card-interactive` (hover: elevation-2 + border-brand/20, translateY(-2px)).

### 상태 뱃지
```tsx
<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(status)}`}>
  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
  {getApplicationStatusLabel(status)}
</span>
```
색 조합은 `recruitment.ts` 함수가 유일한 소스. 배경 100단계 + ring 200단계 + 텍스트 800/900.

### RecruitmentStepper (`features/recruitment/shared/RecruitmentStepper.tsx`)
채용 단계 시각화의 단일 소스. 완료=잉크 채움+체크, 현재=브랜드 블루 ring+dot, 예정=hairline 원.
수평(`orientation="horizontal"`, 카드·대시보드)과 수직(`vertical`, 공고 상세) 지원. 텍스트 나열로 단계를 표현하지 말 것.

### 다크 푸터 (`PublicSiteFooter`)
`bg-[color:var(--surface-dark)]` + `text-[color:var(--on-dark-soft)]`, 링크 hover `text-[color:var(--on-dark)]`.
회사 정보·법적 링크·문의를 갖춘 4열(모바일 1열). 모든 공개 페이지의 마지막 밴드.

### 테이블 (어드민)
- `thead`: `sticky top-0 bg-surface-container-low` + `text-[11px] uppercase tracking-[0.14em] font-mono`
- 행 hover: `hover:bg-surface-container-low/60`, 숫자·날짜 셀 `tabular-nums`
- 행 높이는 콘텐츠 밀도 우선(`py-4`), 초대형 `py-5+` 금지

## 7. Do's and Don'ts

### Do
- 잉크 CTA는 밴드당 하나 — 그래서 눈에 띈다
- 진행 상태는 `RecruitmentStepper`로 시각화
- 실제 제품 UI 미니어처를 마케팅 카드에 임베드 (장식 일러스트 대신)
- 숫자 열은 mono/tabular로 정렬
- 한글 제목에 `keep-all` + `balance`
- 모든 공개 페이지를 다크 푸터로 닫기

### Don't
- `border-l-4` 류 색상 side-stripe (1px hairline만 허용)
- gradient text (`background-clip: text`)
- 보라/인디고 그라디언트, 네온, 글래스모피즘
- 카드 속 카드 중첩
- 균일 아이콘 카드 3열 그리드, 히어로 전체 중앙 정렬 회귀
- 헤드라인 트래킹 -0.02em 미만(한글 뭉개짐)
- bounce/elastic easing, width/height 애니메이션
- 이모지 장식, "한 곳에서 모두" 류 제네릭 카피

## 8. Responsive Behavior

| 구간 | 폭 | 주요 변화 |
|------|-----|----------|
| Desktop | ≥1280px | 히어로 7:5 비대칭, 공고 3열, 어드민 전체 |
| Laptop | 1024–1279px | 공고 2~3열, 어드민 최소 지원 폭 |
| Tablet | 768–1023px | 히어로 세로 스택(텍스트→프래그먼트), 공고 2열, 어드민 차단 |
| Mobile | <768px | 공고 1열, 푸터 1열, display 폰트 clamp 하한(40px), nav 축약 |

- 터치 타깃 ≥44px (`min-h-[44px]` 또는 `py-2.5`+)
- 모바일에서 기능 숨김 금지 — 재배치할 것
- 모션: `prefers-reduced-motion: reduce`에서 entrance/hover transform 전부 무효화(기존 블록 유지·확장)

## 9. 접근성 체크리스트

- [ ] `outline-none` → `focus:ring-2 focus:ring-ring/25` 동반
- [ ] 본문 대비 4.5:1, 대형 텍스트 3:1 (on-dark-soft는 다크 푸터 본문에만)
- [ ] 동적 메시지 `aria-live="polite" aria-atomic="true"`
- [ ] 네비 활성 `aria-current="page"`, 모달 `aria-modal` + `aria-labelledby`
- [ ] 스텝퍼는 `<ol>` + 상태를 텍스트로도 제공(`sr-only` 포함)

## 10. Favicon

`apps/web/src/app/icon.svg` — 잉크(`#16283C`) 배경 + 흰 "H". 토큰 변경 시 favicon 동기화 필수.

## 11. Iteration Guide

1. 한 번에 한 컴포넌트만 수정하고, 토큰 이름으로 참조하라 (`--primary`, `elevation-2`)
2. UI 변경 후 `/design-check`, 커밋 전 `npx tsc --noEmit && npm run lint`
3. 새 색이 필요하면 globals.css에 토큰부터 등록 — 컴포넌트에 raw 값 금지
4. 상태 색은 `recruitment.ts` 함수에만 추가
5. 품질 게이트: `docs/design-renewal/RUBRIC.md` 평균 9.0 미만이면 머지 금지
