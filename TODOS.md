# TODOS — HireFlow 디자인 & UX 개선 목록

> `/plan-design-review` 에서 도출한 항목 (2026-03-27)
> 완료 시 체크박스에 `x` 표시.

---

## 🚨 긴급 — 버그 / 데이터 무결성

### [x] TODO-11: [CRITICAL] 지원서 커스텀 질문 로드 실패 시 오류 게이트 추가
**무엇:** `apply/page.tsx`의 `getJobPostingQuestions().catch(() => [])` 패턴을 명시적 오류 게이트로 교체.
**왜:** 질문 endpoint가 실패하면 커스텀 질문이 소리 없이 사라진 채 지원서가 제출됨. 관리자는 스크리닝 데이터가 누락된 지원서를 받게 되며, 이 실패에는 복구 경로가 없음. **실제 데이터 오손 버그.**
**구현:** try/catch로 감싸서 실패 시 질문 없이 진행하는 대신 오류 상태를 반환 — 지원 폼을 렌더링하지 않고 "질문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." 메시지 + 재시도 버튼 표시.
**pros:** 데이터 무결성 보호, 관리자/지원자 모두 보호.
**cons:** 질문 API 임시 장애 시 지원 불가 (트레이드오프이지만 정직한 실패).
**의존:** 없음.

### [x] TODO-12: [HIGH] homepage `getJobPostings()` empty vs error 상태 분리
**무엇:** `page.tsx`의 `getJobPostings().catch(() => [])` + `length === 0` 체크를 두 개의 별도 상태로 분리.
**왜:** API 실패와 "공고 없음"이 동일한 메시지를 표시함. 회사가 의도적으로 공고를 내지 않을 때도 "불러오지 못했습니다" 오류 배너가 표시됨.
**구현:** `{ data: [], error: Error | null }` 패턴으로 변경. error 시 재시도 안내, data 빈 배열 시 "현재 모집 중인 포지션이 없습니다" 안내.
**pros:** 정확한 사용자 피드백, 향후 copy-paste 오류 방지.
**cons:** 없음.
**의존:** 없음.

### [x] TODO-13: [HIGH] 공개 사이트 네비게이션 통일 (PublicSiteHeader)
**무엇:** 공고 상세(`/job-postings/[id]`) 및 지원 페이지(`/apply`)의 인라인 `<nav>`를 `PublicSiteHeader`로 교체.
**왜:** 홈/목록은 `PublicSiteHeader`(인증 상태 포함), 상세/지원은 로고만 있는 인라인 nav. 로그인한 사용자가 공고 상세 페이지에서 자신의 이름과 로그아웃 버튼을 잃어버림. 미래 개발자가 `PublicSiteHeader`에 기능 추가 시 인라인 nav는 누락됨.
**pros:** 일관된 인증 UX, 유지보수 단순화.
**cons:** 상세 페이지에 full header가 생김 (레이아웃 약간 달라질 수 있음).
**의존:** 없음.

### [x] TODO-14: [HIGH] `PublicSiteHeader`의 `activePath` prop을 `usePathname()`으로 교체
**무엇:** `activePath?: "/" | "/job-postings"` prop 제거 → `usePathname()` 내부 사용.
**왜:** 새 공개 라우트 추가 시마다 헤더 컴포넌트 타입을 수정해야 함. 잊어버리면 새 페이지에서 활성 네비 상태가 사라짐.
**구현:** `PublicSiteHeader`를 `"use client"` + `usePathname()` 으로 전환하거나, `activePath` prop을 문자열로 완화.
**pros:** 자기완결적 컴포넌트, prop 전파 제거.
**cons:** 서버 컴포넌트에서 클라이언트 컴포넌트로 전환 필요.
**의존:** TODO-13.

### [x] TODO-15: [MEDIUM] 상태 뱃지 색상 시스템 통일
**무엇:** `AdminApplicantTable.tsx`의 하드코딩된 `bg-emerald-50`, `bg-amber-50`, `bg-rose-50` 등을 디자인 토큰 기반 `getApplicationStatusClassName()` 유틸리티로 교체.
**왜:** 같은 의미("합격")가 어드민 테이블과 지원자 패널에서 서로 다른 색으로 표시됨. 토큰 시스템을 우회하는 패턴.
**구현:** `shared/lib/` 에 `getApplicationStatusClassName()` 단일 함수 생성, 두 컴포넌트에서 공유.
**pros:** 시각적 일관성, 토큰 시스템 무결성 유지.
**cons:** 없음.
**의존:** 없음.

### [x] TODO-16: [MEDIUM] border-radius 사용 규칙 문서화 및 통일
**무엇:** `rounded-sm`(컨테이너), `rounded-lg`(서브카드), `rounded-full`(뱃지)의 명시적 사용 규칙 수립 및 불일치 수정.
**왜:** 세 가지 radius 값이 문서화된 규칙 없이 혼용됨. `CandidateApplicationStatusCard`의 `rounded-lg`가 전체 `rounded-sm` 시스템과 충돌.
**구현:** DESIGN.md에 규칙 추가 + 불일치 컴포넌트 수정.
**pros:** 시각적 일관성.
**cons:** 없음.
**의존:** TODO-09 (DESIGN.md).

---

## 🎯 UX / 사용자 흐름

### [x] TODO-01: 히어로 CTA 앵커 버튼 추가
**무엇:** `apps/web/src/app/page.tsx` 히어로 섹션에 `#positions` 앵커 버튼 추가.
**왜:** 헤드라인을 읽은 사용자가 다음 액션 없이 스크롤에만 의존하고 있음. Information Hierarchy 원칙: 모든 화면은 '다음 액션'으로 이어져야 함.
**구현:** `<a href="#positions" className="...">기업 오픈 포지션 보기 ↓</a>` 버튼, 히어로 body copy 아래에 배치.
**pros:** 전환율 개선, 의도적인 UX 흐름.
**cons:** 히어로가 약간 길어짐.
**의존:** 없음.

### [x] TODO-02: 지원 위저드 제출 완료 후 성공 화면 추가
**무엇:** 위저드 제출 성공 시 `/me` 페이지로 리다이렉트 + 상단에 완료 배너 표시.
**왜:** 제출 완료 후 사용자가 어디로 가야 할지 모름. 제출 성공 피드백 없음.
**구현:** `ApplicationWizard` 제출 성공 콜백 → `router.push('/me?submitted=1')`, `/me` 페이지에서 `?submitted=1` 쿼리 파라미터 감지 → 완료 배너 렌더링.
**pros:** 명확한 완료 감정, `/me`에서 지원 현황 즉시 확인 가능.
**cons:** URL에 완료 플래그 노출 (사소함).
**의존:** TODO-없음.

### [x] TODO-03: 로그인 후 `returnTo` 복귀 검증 및 수정
> 참고: already correctly implemented via `resolveNextPath()` and `nextPath` prop
**무엇:** `/auth/login?returnTo=/job-postings/[id]` 파라미터가 로그인 후 올바르게 리다이렉트되는지 확인 및 수정.
**왜:** 사용자가 공고 상세에서 "지원하기"를 클릭하면 로그인 페이지로 이동하는데, 로그인 후 원래 공고로 돌아오지 않으면 지원 흐름이 끊김.
**구현:** `CandidateAuthForm.tsx`와 `auth/login/page.tsx`에서 `returnTo` searchParam 처리 로직 검증. 없으면 추가.
**pros:** 로그인 마찰 시 지원 흐름 유지.
**cons:** 없음.
**의존:** 없음.

---

## 🎨 UI 컴포넌트

### [ ] TODO-04: 카드에 채용 단계 타임라인 추가
**무엇:** `JobPostingList.tsx`의 카드에서 "총 N단계" 텍스트를 실제 단계 목록 미리보기로 교체.
**왜:** 3열 카드 그리드는 AI slop 패턴 #2. 단계 타임라인이 추가되면 HireFlow 고유의 콘텐츠로 그리드를 정당화할 수 있음.
**구현:** `JobPostingSummary` 엔티티에 `steps: string[]` 필드 추가 (API 연동) → 카드에 단계 미리보기 리스트 렌더링 (최대 3개 + "..." 처리).
**pros:** AI slop 리스크 해소, 지원자에게 가장 중요한 정보("얼마나 걸리나") 제공.
**cons:** API 변경 필요 (백엔드에서 단계 상세 반환).
**의존:** 백엔드 `JobPostingSummary` 응답에 단계 배열 추가.

### [x] TODO-05: 빈 상태(empty state) 디자인 개선
**무엇:** "현재 채용 공고가 없습니다." 텍스트 → 아이콘 + 안내 문구 + CTA 버튼이 있는 풍부한 빈 상태로 교체.
**왜:** "Empty states are features" — 빈 상태는 사용자에게 다음 액션을 안내할 기회.
**구현:**
- 공개 사이트: 빈 공고 → "현재 모집 중인 포지션이 없습니다. 문의를 남겨보세요." + 문의 링크
- 어드민: 빈 공고 → "첫 채용 공고를 등록해보세요." + "공고 등록" 버튼
**pros:** 따뜻한 UX, 다음 액션 명확화.
**cons:** 공고 수가 0인 경우 거의 없음 (데이터가 있으면 보이지 않음).
**의존:** 없음.

---

## ♿ 접근성

### [x] TODO-06: 포커스 인디케이터 일관화 (WCAG 2.1 AA)
**무엇:** `outline-none focus:border-primary` 패턴에 `focus:ring-2 focus:ring-primary/20` 추가.
**왜:** 일부 입력 필드는 포커스 링이 있고 일부는 없어 키보드 사용자 경험이 불균형. WCAG 2.1 AA 형평성 요건.
**처리 대상:**
- `apps/web/src/features/admin/auth/AdminLoginForm.tsx`
- `apps/web/src/features/admin/auth/AdminAuthForm.tsx`
- `apps/web/src/features/recruitment/job-postings/JobPostingBrowser.tsx`
- `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx`
- `apps/web/src/features/admin/job-postings/JobPostingEditorForm.tsx`
- `apps/web/src/app/admin/(protected)/applicants/page.tsx` (필터 필드)
**pros:** WCAG AA 준수, 키보드 사용자 경험 개선.
**cons:** 없음 (순수 접근성 개선).
**의존:** 없음.

### [x] TODO-07: 터치 타깃 최소 크기 보장 (44px)
**무엇:** 페이지네이션 버튼과 헤더 네비 버튼의 최소 높이를 44px로 증가.
**왜:** 현재 `px-3.5 py-2`에서 버튼 높이 ~28px — Apple HIG 및 WCAG 2.5.5 터치 타깃 최소 크기(44×44px) 미달.
**구현:** `PaginationBar.tsx`, `PublicSiteHeader.tsx`에서 `py-2` → `py-2.5 min-h-[44px]`.
**pros:** 모바일 사용성 개선.
**cons:** 버튼이 약간 커짐.
**의존:** 없음.

---

## 📄 문서

### [x] TODO-08: loading.tsx 스켈레톤 추가
**무엇:** 주요 라우트에 `loading.tsx` 파일 추가.
**왜:** 서버 컴포넌트가 데이터를 가져오는 동안 빈 화면 발생. Next.js App Router `loading.tsx` 컨벤션 미활용.
**처리 대상:**
- `apps/web/src/app/job-postings/loading.tsx`
- `apps/web/src/app/admin/(protected)/loading.tsx`
- `apps/web/src/app/admin/(protected)/applicants/loading.tsx`
- `apps/web/src/app/me/loading.tsx`
**pros:** 인지된 성능 개선, 레이아웃 시프트(CLS) 방지.
**cons:** 스켈레톤 컴포넌트 제작 필요.
**의존:** 없음.

### [x] TODO-09: DESIGN.md 생성
**무엇:** 현재 코드에서 역추출한 디자인 시스템 마스터 문서.
**왜:** DESIGN.md가 없으면 새 기여자가 shadcn 기본값(Inter, 큰 radius)으로 디자인을 덮어씁니다.
**포함 내용:**
- 색상 팔레트 (primary, surface 계층, 시맨틱 색상)
- 타이포그래피 스케일 (font-headline/sans/mono 사용 규칙)
- 간격(spacing) 시스템
- 컴포넌트 변식 가이드 (버튼, 입력, 카드)
- 어드민 UI vs 공개 사이트 구분 지침
**pros:** 기여자 온보딩 시간 단축, 디자인 일관성 유지.
**cons:** 유지보수 필요.
**의존:** 없음.

### [x] TODO-10: 어드민 최소 화면 크기 가드 추가
**무엇:** 어드민 레이아웃에 `min-width: 1024px` viewport 확인 + 모바일 접속 시 데스크탑 안내 화면 표시.
**왜:** 어드민은 데스크탑 전용으로 설계. 현재 모바일에서 레일 네비 + 표 + 필터가 겹쳐서 보임.
**구현:** `apps/web/src/app/admin/(protected)/layout.tsx`에 viewport 체크 → 작은 화면에서 "어드민은 데스크탑에서 이용해 주세요" 안내.
**pros:** 어드민 UX 보호, 지원 범위 명확화.
**cons:** 어드민이 모바일에서 완전히 차단됨 (의도된 동작).
**의존:** 없음.
