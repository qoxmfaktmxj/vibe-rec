# apps/web — Next.js 16 프론트엔드

## 명령어

```bash
npm run dev       # 개발 서버 (port 3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
npx tsc --noEmit  # 타입 체크
```

환경변수: `API_BASE_URL=http://127.0.0.1:8080/api`, `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api`

## 컴포넌트 작성 규칙

### Feature-Sliced 구조
```
features/{domain}/{feature}/Component.tsx
```
- `app/` → `features/` → `shared/` & `entities/` (import 방향: 위→아래)
- features 간 상호 import 금지
- `components/ui/`는 shadcn 기본 — 수정 최소화, feature 컴포넌트에서 래핑

### 공개 사이트
- 모든 공개 페이지에 `PublicSiteHeader` 사용 (인라인 `<nav>` 금지)
- 모바일~데스크탑 반응형 필수

### 어드민
- `admin/(protected)/` route group 하위
- 데스크탑 전용 (`min-width: 1024px`)
- `AdminRailNav` 사이드바 네비게이션
- `AdminMobileGuard`가 작은 화면 차단

## 디자인 시스템 요약

**반드시 `DESIGN.md` (프로젝트 루트) 참조.**

- 색상: `globals.css` 토큰만 사용. `bg-card`(흰색), `bg-background`(연한 블루), `text-on-surface` 등
- 폰트: `font-headline`/`font-sans`(Sora), `font-mono`(IBM Plex Mono)
- Radius: `rounded-lg`(컨테이너/버튼), `rounded-full`(뱃지/아바타)
- 뱃지 색상: `getApplicationStatusClassName()` from `shared/lib/recruitment.ts`

## 접근성 체크리스트

- `outline-none` 사용 시 반드시 `focus:ring-2 focus:ring-primary/20` 동반
- 터치 타깃 최소 44px (`min-h-[44px]` 또는 `py-2.5`)
- 동적 메시지: `aria-live="polite" aria-atomic="true"`
- 모달: `aria-modal="true"` + `aria-labelledby`

## BFF Route Handlers

`src/app/api/` 하위의 route handler 패턴:
1. `cookies()`로 세션 쿠키 읽기
2. Spring API에 `X-Admin-Session` 또는 `X-Candidate-Session` 헤더 전달
3. API 응답을 브라우저 친화적으로 변환
4. 세션 토큰을 클라이언트 컴포넌트에 노출하지 않기
