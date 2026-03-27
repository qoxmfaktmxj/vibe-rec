# DESIGN.md — HireFlow 디자인 시스템

> 이 파일은 HireFlow의 디자인 결정을 문서화합니다.
> 새 컴포넌트를 만들 때 이 파일을 먼저 읽고, shadcn 기본값(Inter, 큰 radius)을 그대로 사용하지 마세요.
> 마지막 업데이트: 2026-03-27

---

## 1. 브랜드 정체성

**제품 유형:** HYBRID — 공개 채용 사이트(마케팅) + 관리 도구(앱 UI)
**디자인 방향:** 신뢰감 있는 HR 도구. 장식 없이 명확하고, 와인-모래 팔레트로 따뜻하게.

---

## 2. 색상 팔레트

모든 색상은 `apps/web/src/app/globals.css`의 CSS 변수로 정의됩니다. **직접 Tailwind 색상을 사용하지 마세요.** 토큰을 사용하세요.

### Primary (브랜드 색)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `#641a41` | CTA 버튼, 링크, 액센트 |
| `--primary-foreground` | `#f9f8f6` | primary 배경 위 텍스트 |
| `--primary-container` | `#fdf2f8` | 연한 primary 배경 (히어로, 강조 섹션) |
| `--primary-fixed` | `#f7dbe8` | 매우 연한 primary (뱃지 배경 등) |

### Surface 계층 (M3 인스파이어드)
배경 레이어를 쌓을 때 이 순서를 따르세요:
```
페이지 배경:         --background (#f9f8f6, 크림색)
카드/패널:           --surface (#f9f8f6) → --card (#ffffff)
컨테이너 (낮음):    --surface-container-low (#f3f1ed)
컨테이너:           --surface-container (#eeebe6)
컨테이너 (높음):    --surface-container-high (#e8e4de)
컨테이너 (최고):    --surface-container-highest (#ddd7cf)
```

**규칙:** 중첩된 카드는 부모보다 밝아야 합니다. `bg-card`(흰색)이 `bg-surface`(크림) 위에 올라가는 패턴.

### 텍스트 색상
| 토큰 | 용도 |
|------|------|
| `text-on-surface` | 기본 본문 텍스트 |
| `text-on-surface-variant` | 보조 텍스트, 라벨, 캡션 |
| `text-primary` | 강조 텍스트, 링크 |
| `text-destructive` | 오류, 경고 |

### 금지 사항
❌ `text-gray-500`, `bg-blue-100` 등 직접 Tailwind 색상 사용
❌ 새 hex 값을 코드에 하드코딩 (`bg-[#641a41]` 대신 `bg-primary`)
⚠️ 예외: 시맨틱 의미가 있는 상태 색상 (emerald=합격, rose=불합격, amber=임시저장)은 허용

---

## 3. 타이포그래피

### 폰트 패밀리
| 변수 | 사용처 |
|------|--------|
| `font-headline` | 제목, 브랜드명, 공고 제목, 섹션 헤더 |
| `font-sans` | 본문, 설명, UI 라벨 |
| `font-mono` | 메타데이터, 카운터, 상태 라벨, 날짜 |

**절대 사용하지 마세요:** `font-inter`, `font-roboto`, `font-system` 등 기본 스택.

### 타입 스케일
| 크기 | 클래스 | 용도 |
|------|--------|------|
| 72px / light | `text-7xl font-light tracking-[-0.06em]` | 메인 히어로 헤드라인 |
| 48px / light | `text-5xl font-light tracking-[-0.06em]` | 모바일 히어로 |
| 30px / medium | `text-3xl font-medium tracking-[-0.04em]` | 페이지 제목, 섹션 제목 |
| 24px / medium | `text-2xl font-medium tracking-[-0.04em]` | 카드 제목, 모달 제목 |
| 18px / medium | `text-lg font-medium tracking-[-0.03em]` | 카드 내 항목 제목 |
| 14px / normal | `text-sm leading-7` | 본문, 설명 |
| 13px / normal | `text-[13px]` | 네비게이션 링크 |
| 11px / mono | `font-mono text-[11px] uppercase tracking-[0.18em~0.28em]` | 메타 라벨, 카운터 |
| 11px / semibold | `text-[11px] font-semibold uppercase tracking-[0.14em]` | 뱃지, 버튼 (소형) |

---

## 4. 간격 & 레이아웃

### 최대 너비
| 컨텍스트 | 클래스 |
|----------|--------|
| 공개 사이트 전체 | `max-w-7xl` |
| 지원 위저드 / 좁은 폼 | `max-w-4xl` |
| 히어로 텍스트 영역 | `max-w-5xl` |
| 인증 폼 | `max-w-md` |

### 패딩 시스템
| 용도 | 클래스 |
|------|--------|
| 페이지 좌우 | `px-6 md:px-16` |
| 카드/패널 내부 | `p-8` |
| 소형 카드 | `p-6` |
| 표 행 | `px-6 py-5` |
| 버튼 (기본) | `px-5 py-2` |
| 버튼 (소형) | `px-3.5 py-2` |

---

## 5. Border Radius 규칙

HireFlow는 **거의 평면**에 가까운 미학을 사용합니다. `--radius: 0.125rem` (≈2px).

### 사용 규칙 (계층별)

| 계층 | 클래스 | 용도 | 예시 |
|------|--------|------|------|
| 최상위 컨테이너 | `rounded-sm` | 페이지 카드, 모달, 패널 | `<div className="rounded-sm border bg-card">` |
| 서브 컨테이너 | `rounded-sm` | 카드 내 중첩 섹션 | info box, 코드 블럭 |
| 버튼 / 입력창 | `rounded-sm` | CTA, 폼 필드, 뱃지 | `<button>`, `<input>`, 상태 뱃지 |
| 아바타 | `rounded-full` | 사용자 이니셜 원형만 | `<div className="rounded-full">` |

### 불일치 수정 이력
- `CandidateApplicationStatusCard` — 하위 스텝 카드가 `rounded-lg`를 사용했으나 `rounded-sm`으로 통일 완료.
- `ApplicationWizard` — 에러/상태 메시지 박스 `rounded-lg` → `rounded-sm` 적용 필요.

### ⚠️ 금지 및 예외

**절대 금지:** `rounded-xl`, `rounded-2xl`, `rounded-3xl` — 시스템과 어울리지 않는 bubbly 미학.

**허용 예외:**
- shadcn 기본 컴포넌트(Dialog, DropdownMenu, Popover, Tooltip 등): shadcn 기본값인 `rounded-lg` 유지.
- 커스텀 작성 컴포넌트: 반드시 `rounded-sm` 사용.

### 빠른 체크리스트
새 컴포넌트 작성 시:
- [ ] 카드/패널: `rounded-sm border border-outline-variant`
- [ ] 버튼: `rounded-sm`
- [ ] 뱃지: `rounded-sm px-2.5 py-1`
- [ ] 아바타만: `rounded-full`
- [ ] `rounded-lg` 이상 사용 시 shadcn 예외인지 확인

---

## 6. 컴포넌트 가이드

### 버튼
```tsx
// Primary CTA
<button className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5">
  버튼 텍스트
</button>

// Secondary / Outline
<button className="rounded-sm border border-outline-variant px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-primary hover:text-primary">
  버튼 텍스트
</button>
```

### 입력 필드 (필수: focus ring 포함)
```tsx
// 기본 입력
<input className="w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20" />

// 텍스트에어리어 (rounded-lg 변형 사용 가능)
<textarea className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20" />
```

**⚠️ 중요:** `outline-none`을 사용할 때 반드시 `focus:ring-2 focus:ring-primary/20`을 함께 사용하세요. WCAG 2.1 AA 요건.

### 카드
```tsx
<div className="rounded-sm border border-outline-variant bg-card p-6">
  {/* 카드 내용 */}
</div>
```

### 상태 뱃지
```tsx
// 공유 유틸리티 사용 (shared/lib/recruitment.ts)
import { getApplicationStatusClassName, getApplicationStatusLabel } from "@/shared/lib/recruitment";

<span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(status)}`}>
  {getApplicationStatusLabel(status)}
</span>
```

### 페이지네이션
`PaginationBar` (클라이언트 측, `useState`) 또는 `PaginationLinks` (서버 측, URL 파라미터) 중 선택:
- 클라이언트 상태 페이지네이션 → `PaginationBar`
- URL-based SSR 페이지네이션 → `PaginationLinks` (admin/applicants 패턴)

---

## 7. 공개 사이트 vs 어드민 구분

| 항목 | 공개 사이트 | 어드민 |
|------|------------|--------|
| 레이아웃 | `PublicSiteHeader` + 자유형 | `AdminRailNav` 사이드바 + 메인 |
| 최대 너비 | `max-w-7xl` | 전체 폭 (사이드바 포함) |
| 타깃 사용자 | 지원자 (모바일 포함) | HR 담당자 (데스크탑 전용) |
| 뷰포트 지원 | 모바일 ~ 데스크탑 | `min-width: 1024px` 이상 |
| 주요 색조 | 따뜻한 크림 배경 + 와인 강조 | 동일 토큰, 더 조밀한 데이터 레이아웃 |

---

## 8. 공개 사이트 네비게이션

모든 공개 페이지에서 `PublicSiteHeader`를 사용하세요. 인라인 `<nav>`를 직접 만들지 마세요.

```tsx
// activePath는 현재 경로 문자열. 어떤 경로든 받을 수 있습니다.
<PublicSiteHeader activePath="/job-postings/123" />
```

`startsWith()` 매칭으로 `/job-postings/*` 하위 경로에서 "채용 공고" 탭이 활성화됩니다.

---

## 9. 접근성 (a11y) 체크리스트

새 컴포넌트 작성 시 확인하세요:

- [ ] 입력 필드에 `focus:ring-2 focus:ring-primary/20` 포함 (`outline-none`만 사용 금지)
- [ ] 버튼의 최소 높이 44px (터치 타깃, `min-h-[44px]` 또는 `py-2.5` 이상)
- [ ] 동적 오류/성공 메시지에 `aria-live="polite" aria-atomic="true"`
- [ ] 네비게이션 활성 상태에 `aria-current="page"`
- [ ] 모달에 `aria-modal="true"` + `aria-labelledby`
- [ ] 스크린 리더를 위한 시각적으로 숨겨진 텍스트: `<span className="sr-only">`

---

## 10. 금지 패턴 (AI Slop 방지)

다음 패턴은 사용하지 마세요:

| 패턴 | 대신 사용 |
|------|---------|
| 보라/인디고 그라디언트 | 와인 primary + 크림 배경 |
| 색상 원형 아이콘 + 3열 그리드 | 콘텐츠가 충분한 카드 |
| 히어로에 카드 배치 | 히어로는 텍스트 + CTA만 |
| `text-center` 모든 것 | 히어로만 중앙 정렬 |
| 균일한 큰 `rounded-xl` | `rounded-sm` (시스템 radius) |
| 이모지 장식 | 텍스트 또는 SVG 아이콘 |
| "한 곳에서 모두" 같은 제네릭 카피 | 구체적인 제품 언어 |
